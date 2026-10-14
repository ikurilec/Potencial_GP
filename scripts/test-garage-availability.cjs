const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const M = require('../garage-model.js');
let A = {};
try { A = require('../garage-availability.js'); } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') throw e; }
const DATE = '2026-10-14', INTERVAL = { start: '08:00', end: '16:30' };
let tests = 0, failures = 0;
function test(name, fn) { try { fn(); tests++; console.log('PASS ' + name); } catch (e) { failures++; console.error('FAIL ' + name + '\n' + e.stack); } }
function setup() {
  const s = M.createState();
  s.members = Array.from({ length: 12 }, (_, i) => ({ id: 'u' + i, name: 'User ' + i, role: i === 11 ? 'admin' : 'office', active: true, access: true }));
  return Object.assign(s, { serverDate: '2026-10-13', window: M.windowFor('2026-10-13'), me: s.members[11] });
}
function booking(s, slot, start = '08:00', end = '16:30', extra = {}) {
  s.reservations.push(Object.assign({ id: 'r' + s.reservations.length, owner: 'u' + s.reservations.length, name: 'Person ' + s.reservations.length, date: DATE, spaceId: slot, start, end }, extra));
}
function block(s, slot, start, end) { s.blocks.push({ id: 'b' + s.blocks.length, date: DATE, spaceId: slot, start, end, reason: 'Maintenance' }); }
function day(s, date = DATE, interval = INTERVAL) { assert.equal(typeof A.day, 'function', 'pure availability day API must exist'); return A.day(s, date, interval); }
const place = (r, id) => r.places.find(p => p.id === id);
const pool = r => r.places.find(p => p.floor === -1);
const windows = p => p.freeWindows.map(w => [w.start, w.end, w.available]);
const min = t => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
const time = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
// Independent minute-grid oracle: no production overlap, union or model calls.
function oracle(rows, capacity, units, interval = INTERVAL) {
  const values = [];
  for (let minute = min(interval.start); minute < min(interval.end); minute++) {
    const held = rows.filter(r => min(r.start) <= minute && minute < min(r.end));
    const cars = held.filter(r => !r.block).length;
    const blocked = new Set(held.filter(r => r.block && units.includes(r.spaceId)).map(r => r.spaceId)).size;
    values.push(Math.max(0, capacity - cars - blocked));
  }
  const out = [];
  values.forEach((available, i) => {
    if (!available) return;
    const start = time(min(interval.start) + i), end = time(min(interval.start) + i + 1), last = out.at(-1);
    if (last && last[1] === start && last[2] === available) last[1] = end; else out.push([start, end, available]);
  });
  return { available: Math.min(...values), windows: out };
}test('four-hour clock reflects full parking duration independently of displayed interval', () => {
  for(const slot of ['b3-1','b1-7'])for(const [start,end,expected] of [['08:00','12:00',true],['08:00','12:01',false],['08:00','11:59',true],['08:00','16:00',false],['17:00','19:00',true]]){const s=setup();booking(s,slot,start,end);const original=JSON.stringify(s);for(const interval of [INTERVAL,{start:'09:00',end:'10:00'}])assert.equal(day(s,DATE,interval).shortReservation,expected,slot+' '+start+'-'+end);assert.equal(JSON.stringify(s),original);}
});
test('clock ignores blocks, attendance only, other dates and inactive numbered slots', () => {
  const s=setup();block(s,'b3-1','09:00','10:00');s.attendance=[{owner:'u0',date:DATE,start:'08:00',end:'10:00'}];booking(s,'b3-2','08:00','10:00',{date:'2026-10-15'});s.config.slots.find(x=>x.id==='b3-3').active=false;booking(s,'b3-3','08:00','09:00');assert.equal(day(s).shortReservation,false);booking(s,'b1-7','12:00','13:00',{kind:'fleet',owner:'u11'});assert.equal(day(s).shortReservation,true);
});

test('UMD API exposes a pure day function', () => assert.equal(typeof A.day, 'function'));
test('eight active physical places are free for an empty in-window day', () => {
  const r = day(setup()); assert.equal(r.known, true); assert.equal(r.capacity, 8); assert.equal(r.available, 8); assert.equal(r.partial, false);
  assert.equal(r.places.length, 7); assert.equal(pool(r).capacity, 2); assert.equal(pool(r).available, 2);
  assert.deepEqual(windows(pool(r)), [['08:00', '16:30', 2]]);
});
test('eight simultaneous bookings occupy all physical places', () => {
  const s = setup(); s.config.slots.forEach(p => booking(s, p.id)); const r = day(s);
  assert.equal(r.capacity, 8); assert.equal(r.available, 0); assert.equal(r.partial, false); assert.ok(r.places.every(p => !p.availableWholeInterval));
});
test('numbered morning booking exposes only the real afternoon free window', () => {
  const s = setup(); booking(s, 'b3-1', '08:00', '12:00'); const r = day(s), p = place(r, 'b3-1');
  assert.equal(r.available, 7); assert.equal(r.partial, true); assert.equal(p.availableWholeInterval, false); assert.deepEqual(windows(p), [['12:00', '16:30', 1]]);
});
test('later booking splits free afternoon into exact real gaps', () => {
  const s = setup(); booking(s, 'b3-1', '08:00', '12:00'); booking(s, 'b3-1', '13:00', '14:00');
  assert.deepEqual(windows(place(day(s), 'b3-1')), [['12:00', '13:00', 1], ['14:00', '16:30', 1]]);
});
test('different numbered bays free in morning and afternoon are not whole-interval free', () => {
  const s = setup(); booking(s, 'b3-1', '08:00', '12:00'); booking(s, 'b3-2', '12:00', '16:30'); const r = day(s);
  assert.equal(r.available, 6); assert.equal(place(r, 'b3-1').availableWholeInterval, false); assert.equal(place(r, 'b3-2').availableWholeInterval, false);
});
test('staggered anonymous rows retain one whole-interval physical space after repacking', () => {
  const s = setup(); booking(s, 'b1-7', '08:00', '12:00'); booking(s, 'b1-8', '12:00', '16:30'); const r = day(s), p = pool(r);
  assert.equal(r.available, 7); assert.equal(p.available, 1); assert.equal(p.availableWholeInterval, true); assert.equal(p.partial, true);
  assert.deepEqual(windows(p), [['08:00', '16:30', 1]]);
});
test('two anonymous morning cars leave both spaces free after noon', () => {
  const s = setup(); booking(s, 'b1-7', '08:00', '12:00'); booking(s, 'b1-8', '08:00', '12:00'); const p = pool(day(s));
  assert.equal(p.available, 0); assert.equal(p.availableWholeInterval, false); assert.equal(p.partial, true); assert.deepEqual(windows(p), [['12:00', '16:30', 2]]);
});
test('pool windows separate one free place from two free places', () => {
  const s = setup(); booking(s, 'b1-7', '09:00', '12:00'); const p = pool(day(s));
  assert.equal(p.available, 1); assert.deepEqual(windows(p), [['08:00', '09:00', 2], ['09:00', '12:00', 1], ['12:00', '16:30', 2]]);
});
test('numbered duplicate overlapping and touching blocks use their union', () => {
  const s = setup(); block(s, 'b3-1', '08:00', '10:00'); block(s, 'b3-1', '09:00', '12:00'); block(s, 'b3-1', '12:00', '13:00');
  assert.deepEqual(windows(place(day(s), 'b3-1')), [['13:00', '16:30', 1]]);
});
test('pool duplicate same-unit blocks consume one capacity unit', () => {
  const s = setup(); block(s, 'b1-7', '08:00', '12:00'); block(s, 'b1-7', '09:00', '13:00'); block(s, 'b1-7', '13:00', '14:00');
  const p = pool(day(s)); assert.equal(p.available, 1); assert.deepEqual(windows(p), [['08:00', '14:00', 1], ['14:00', '16:30', 2]]);
});
test('disabled places reduce physical capacity and never become free numbered bays', () => {
  const s = setup(); s.config.slots[0].active = false; s.config.slots[7].active = false; const r = day(s);
  assert.equal(r.capacity, 6); assert.equal(r.available, 6); assert.equal(place(r, 'b3-1'), undefined); assert.equal(pool(r).capacity, 1);
});
test('activeSlots-only snapshot treats listed units as active without editing config', () => {
  const s = setup(); s.config.activeSlots = s.config.slots.filter(p => p.active).map(({ active, ...p }) => p); delete s.config.slots;
  const before = JSON.stringify(s), r = day(s); assert.equal(r.known, true); assert.equal(r.capacity, 8); assert.equal(r.available, 8); assert.equal(JSON.stringify(s), before);
});
test('restricted pool units remain physical capacity without granting reservation permission', () => {
  const s = setup(); s.config.slots.slice(6).forEach(p => p.allowedMembers = ['u0']); booking(s, 'b1-7', '08:00', '12:00', { owner: 'u0' });
  const before = JSON.stringify(s), r = day(s); assert.equal(pool(r).available, 1); assert.equal(JSON.stringify(s), before); assert.deepEqual(s.config.slots[6].allowedMembers, ['u0']);
});
test('guest fleet cars count occupancy without leaking vehicle or creator data', () => {
  const s = setup(); booking(s, 'b1-7', '08:00', '12:00', { owner: 'u11', name: 'Guest <img>', kind: 'fleet', vehicle: { brand: 'Car', color: '#ff0000' }, creatorName: 'Admin' });
  const p = pool(day(s)); assert.equal(p.available, 1); assert.deepEqual(p.bookings, [{ name: 'Guest <img>', start: '08:00', end: '12:00', kind: 'fleet' }]);
});
test('retained revoked-owner cars count against assigned physical pool capacity', () => {
  const s = setup(); s.members[0].access = false; s.members[0].role = 'management'; s.config.slots.slice(6).forEach(p => p.allowedRoles = ['office']); booking(s, 'b1-7', '08:00', '16:30', { owner: 'u0' });
  assert.equal(pool(day(s)).available, 1);
});
test('current actor owning a pool booking does not erase the other physical space', () => {
  const s = setup(); booking(s, 'b1-7', '08:00', '16:30', { owner: s.me.id });
  assert.equal(pool(day(s)).available, 1);
});
test('boundary-touching reservations do not occupy the selected interval', () => {
  const s = setup(); booking(s, 'b3-1', '07:00', '08:00'); booking(s, 'b3-1', '16:30', '18:00'); booking(s, 'b1-7', '16:30', '18:00'); const r = day(s);
  assert.equal(r.available, 8); assert.equal(r.partial, false); assert.deepEqual(windows(place(r, 'b3-1')), [['08:00', '16:30', 1]]);
});
test('booking and block details keep actual day hours outside the requested interval', () => {
  const s = setup(); booking(s, 'b3-1', '07:00', '10:00'); block(s, 'b3-1', '17:00', '19:00'); const p = place(day(s), 'b3-1');
  assert.deepEqual(p.bookings, [{ name: 'Person 0', start: '07:00', end: '10:00' }]); assert.deepEqual(p.blocks, [{ start: '17:00', end: '19:00', reason: 'Maintenance' }]);
});
test('outside rolling window is unknown even when arrays are empty', () => {
  const s = setup(); for (const date of ['2026-10-12', '2026-11-12', '2027-10-14']) {
    const r = day(s, date); assert.deepEqual(r, { known: false, capacity: null, available: null, partial: false, places: [] });
  }
});
test('window validation handles year boundaries and leap days deterministically', () => {
  const s = setup(); s.serverDate = '2026-12-20'; s.window = M.windowFor(s.serverDate);
  assert.equal(day(s, '2027-01-18').known, true); assert.equal(day(s, '2027-01-19').known, false);
  s.serverDate = '2028-02-20'; s.window = M.windowFor(s.serverDate); assert.equal(day(s, '2028-02-29').known, true); assert.equal(day(s, '2028-02-30').known, false);
});
test('malformed and typed intervals produce unknown with no fake free count', () => {
  const s = setup(); for (const interval of [null, [], '', 1, { start: '8:00', end: '16:30' }, { start: '08:00', end: '24:00' }, { start: '16:30', end: '08:00' }, { start: '08:00', end: '08:00' }, { start: 800, end: '16:30' }, { start: '', end: '16:30' }, { start: ['08:00'], end: '16:30' }]) {
    const r = day(s, DATE, interval); assert.equal(r.known, false); assert.equal(r.available, null); assert.deepEqual(r.places, []);
  }
});
test('malformed snapshot bounds and missing arrays fail closed', () => {
  for (const modify of [s => delete s.window, s => s.window.end = 'bad', s => s.window.start = '2026-11-20', s => s.serverDate = 'bad', s => delete s.reservations, s => s.blocks = {}, s => s.reservations.push({ date: DATE, spaceId: 'b3-1', start: '8:00', end: '12:00' })]) {
    const s = setup(); modify(s); assert.equal(day(s).known, false);
  }
});
test('unknown or typed dates never throw', () => {
  for (const date of [null, {}, ['2026-10-14'], 20261014, 'bad', '2026-02-29']) assert.equal(day(setup(), date).known, false);
  assert.equal(day(null).known, false);
});
test('same-day state is immutable and output objects are detached', () => {
  const s = setup(); booking(s, 'b1-7', '08:00', '12:00'); booking(s, 'b1-8', '12:00', '16:30'); block(s, 'b3-1', '10:00', '11:00'); const before = JSON.stringify(s), r = day(s);
  r.places[0].blocks[0].reason = 'Changed'; pool(r).bookings[0].name = 'Changed'; assert.equal(JSON.stringify(s), before);
});
test('minute oracle agrees with exact numbered free gaps in 160 deterministic cases', () => {
  let seed = 911; const rnd = n => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed % n; };
  for (let i = 0; i < 160; i++) {
    const s = setup(); for (let j = 0; j < 5; j++) { const a = 360 + rnd(700), b = a + 1 + rnd(140); block(s, 'b3-1', time(a), time(b)); }
    const expected = oracle(s.blocks.map(b => ({ ...b, block: true })), 1, ['b3-1']), actual = place(day(s), 'b3-1');
    assert.deepEqual(windows(actual), expected.windows, 'numbered case ' + i); assert.equal(actual.available, expected.available);
  }
});
test('minute oracle agrees with pool physical counts in 180 deterministic cases', () => {
  let seed = 717; const rnd = n => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed % n; };
  for (let i = 0; i < 180; i++) {
    const s = setup(); for (let j = 0; j < 4; j++) { const a = 420 + rnd(580), b = a + 1 + rnd(120); block(s, rnd(2) ? 'b1-7' : 'b1-8', time(a), time(b)); }
    const expected = oracle(s.blocks.map(b => ({ ...b, block: true })), 2, ['b1-7', 'b1-8']), actual = pool(day(s));
    assert.deepEqual(windows(actual), expected.windows, 'pool case ' + i); assert.equal(actual.available, expected.available);
  }
});
test('minute oracle agrees with mixed guest bookings and blocks in 180 deterministic cases', () => {
  let seed = 41; const rnd = n => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed % n; };
  for (let i = 0; i < 180; i++) {
    const s = setup(), rows = [], units = ['b1-7', 'b1-8'];
    for (let j = 0; j < 7; j++) {
      const a = 420 + rnd(21) * 30, b = Math.min(1140, a + 30 + rnd(4) * 30), candidate = { spaceId: units[rnd(2)], start: time(a), end: time(b), block: rnd(2) === 0 };
      const proposed = rows.concat(candidate); let valid = true;
      for (let m = 420; m < 1140; m += 30) {
        const held = proposed.filter(r => min(r.start) <= m && m < min(r.end));
        if (held.filter(r => !r.block).length + new Set(held.filter(r => r.block).map(r => r.spaceId)).size > 2) valid = false;
      }
      if (!valid) continue; rows.push(candidate);
      if (candidate.block) block(s, candidate.spaceId, candidate.start, candidate.end);
      else booking(s, candidate.spaceId, candidate.start, candidate.end, { owner: 'u11', kind: 'fleet' });
    }
    const expected = oracle(rows, 2, units), result = day(s); assert.equal(result.known, true, 'known mixed case ' + i);
    assert.deepEqual(windows(pool(result)), expected.windows, 'mixed case ' + i); assert.equal(pool(result).available, expected.available);
  }
});
test('browser global uses the already loaded model with the same results', () => {
  assert.equal(typeof A.day, 'function'); const context = { SatoriGarageModel: M }; context.window = context;
  vm.runInNewContext(fs.readFileSync(require.resolve('../garage-availability.js'), 'utf8'), context);
  assert.equal(typeof context.SatoriGarageAvailability.day, 'function'); assert.equal(context.SatoriGarageAvailability.day(setup(), DATE, INTERVAL).available, 8);
});
console.log(tests + ' Garage availability tests passed; ' + failures + ' failed');
assert.equal(failures, 0, failures + ' availability tests failed');
