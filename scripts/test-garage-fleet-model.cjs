'use strict';
const assert = require('node:assert/strict');
const M = require('../garage-model.js');
let passed = 0, failed = 0;
function test(name, fn) { try { fn(); passed++; console.log('PASS ' + name); } catch (e) { failed++; console.error('FAIL ' + name + ': ' + e.message); } }
const error = code => e => e.code === code;
function setup() {
  const s = M.createState();
  s.members = ['fleet', 'admin', 'a', 'b'].map(id => ({ id, name: 'Person ' + id, role: id === 'a' || id === 'b' ? 'office' : id, active: true, weeklyDays: 3 }));
  let id = 0;
  const ctx = { today: '2026-10-13', now: '2026-10-13T07:00:00.000Z', id: () => 'fleet-' + (++id) };
  const apply = (who, command, payload, context) => M.apply(s, { id: who }, command, payload, Object.assign({}, ctx, context));
  const reserve = (who = 'fleet', payload = {}, context) => apply(who, 'reservationSave', Object.assign({ date: '2026-10-14', spaceId: 'b3-1', start: '08:00', end: '12:00' }, payload), context).result;
  const extra = (payload = {}, who = 'fleet', context) => reserve(who, Object.assign({ kind: 'fleet', name: 'Guest One', vehicle: { brand: 'Skoda Octavia', color: '#123abc' } }, payload), context);
  const unchanged = (fn, code) => { const before = JSON.stringify(s); assert.throws(fn, error(code)); assert.equal(JSON.stringify(s), before); };
  return { s, ctx, apply, reserve, extra, unchanged };
}

test('fleet bookings retain creator and distinct beneficiary vehicle without attendance', () => {
  const f = setup(), first = f.extra({ owner: 'a', creatorName: 'Forged creator' }), second = f.extra({ spaceId: 'b3-2', name: 'Guest Two' });
  assert.equal(first.kind, 'fleet'); assert.equal(first.owner, 'fleet'); assert.equal(first.name, 'Guest One');
  assert.deepEqual(first.vehicle, { brand: 'Skoda Octavia', color: '#123abc' });
  if (first.creatorName !== undefined) assert.equal(first.creatorName, 'Person fleet');
  assert.notEqual(first.id, second.id); assert.equal(f.s.attendance.length, 0);
  const projected = M.snapshot(f.s, { id: 'a' }, f.ctx).reservations;
  assert.deepEqual(projected[0].vehicle, first.vehicle); assert.equal(projected[0].kind, 'fleet');
  projected[0].vehicle.brand = 'mutated'; assert.equal(f.s.reservations[0].vehicle.brand, 'Skoda Octavia');
});
test('ordinary users cannot forge fleet create or edit an existing fleet row after demotion', () => {
  const f = setup(); f.unchanged(() => f.extra({}, 'a'), 'FORBIDDEN');
  const r = f.extra(); f.s.members.find(m => m.id === 'fleet').role = 'office';
  f.unchanged(() => f.reserve('fleet', { id: r.id, revision: r.revision, spaceId: 'b3-2' }), 'FORBIDDEN');
  f.unchanged(() => f.reserve('fleet', { id: r.id, revision: r.revision, kind: 'personal' }), 'FORBIDDEN');
});
test('personal defaults stay unchanged and personal overlap still conflicts in both directions', () => {
  const f = setup(), own = f.reserve('fleet', { name: 'forged', vehicle: { brand: 'forged' } });
  assert.equal(own.name, 'Person fleet'); assert.equal(own.kind, undefined); assert.equal(own.vehicle, undefined);
  f.extra({ spaceId: 'b3-2' }); f.extra({ spaceId: 'b3-3' });
  f.unchanged(() => f.reserve('fleet', { spaceId: 'b3-4' }), 'CONFLICT');
  const other = setup(); other.extra(); other.reserve('fleet', { spaceId: 'b3-2' });
  other.unchanged(() => other.reserve('fleet', { spaceId: 'b3-3' }), 'CONFLICT');
});
test('extra-car names and vehicles require bounded typed values and reject controls', () => {
  const f = setup();
  for (const name of ['', ' '.repeat(3), 'a'.repeat(121), 'Guest\nOne', 'Guest\u007f', 42, {}]) f.unchanged(() => f.extra({ name }), 'INVALID_PAYLOAD');
  for (const vehicle of [undefined, null, {}, { brand: '' }, { brand: 'a'.repeat(61) }, { brand: 'x\n', color: '#123456' }, { brand: 42 }, { brand: 'x', color: '#xyz123' }, { brand: 'x', color: 12 }]) f.unchanged(() => f.extra({ vehicle }), 'INVALID_VEHICLE');
  assert.equal(f.extra({ name: ' Guest One ', vehicle: { brand: ' Volvo XC60 ', color: '#ABCDEF' } }).vehicle.color, '#abcdef');
});
test('extras still enforce real bay occupancy, blocks, restrictions and date/time bounds', () => {
  const f = setup(); f.extra(); f.unchanged(() => f.extra({ name: 'Guest Two' }), 'CONFLICT');
  f.apply('admin', 'blockSave', { date: '2026-10-14', spaceId: 'b3-2', start: '08:00', end: '09:00' });
  f.unchanged(() => f.extra({ spaceId: 'b3-2' }), 'CONFLICT');
  f.s.config.slots.find(s => s.id === 'b3-3').allowedMembers = ['a'];
  f.unchanged(() => f.extra({ spaceId: 'b3-3' }), 'RESTRICTED');
  f.unchanged(() => f.extra({ date: '2026-11-12' }), 'DATE_WINDOW');
  f.unchanged(() => f.extra({ start: '12:00', end: '08:00' }), 'INVALID_TIME');
});
test('pool permits two concurrent fleet cars but never a third', () => {
  const f = setup(); f.extra({ floor: -1, spaceId: '' });
  assert.equal(M.poolAvailability(f.s, { id: 'fleet' }, { date: '2026-10-14', kind: 'fleet', start: '08:00', end: '12:00' }, f.ctx).canReserve, true);
  f.extra({ floor: -1, spaceId: '', name: 'Guest Two' });
  assert.equal(new Set(f.s.reservations.map(r => r.spaceId)).size, 2);
  f.unchanged(() => f.extra({ floor: -1, spaceId: '', name: 'Guest Three' }), 'CONFLICT');
  const preview = M.poolAvailability(f.s, { id: 'fleet' }, { date: '2026-10-14', kind: 'fleet' }, f.ctx);
  assert.equal(preview.available, 0); assert.equal(preview.canReserve, false);
});
test('fleet preview applies permissions bounds and safe own-row edit semantics', () => {
  const f = setup(), r = f.extra({ floor: -1, spaceId: '' });
  const preview = p => M.poolAvailability(f.s, { id: 'fleet' }, Object.assign({ date: '2026-10-14', kind: 'fleet' }, p), f.ctx);
  assert.equal(M.poolAvailability(f.s, { id: 'a' }, { date: '2026-10-14', kind: 'fleet' }, f.ctx).code, 'FORBIDDEN');
  assert.equal(M.poolAvailability(f.s, { id: 'a' }, { date: '2026-10-14', id: r.id }, f.ctx).code, 'FORBIDDEN');
  assert.equal(preview({ date: '2026-11-12' }).code, 'DATE_WINDOW');
  assert.equal(preview({ id: r.id }).canReserve, true);
  f.s.config.slots.filter(s => s.floor === -1).forEach(s => s.allowedRoles = ['office']);
  assert.equal(preview().code, 'RESTRICTED');
});
test('fleet editing retains kind and creator; failures and stale revisions roll back atomically', () => {
  const f = setup(), r = f.extra(); f.extra({ spaceId: 'b3-2' });
  f.unchanged(() => f.extra({ id: r.id, revision: r.revision, spaceId: 'b3-2' }), 'CONFLICT');
  f.unchanged(() => f.extra({ id: r.id, revision: 0 }), 'STALE');
  f.unchanged(() => f.extra({ id: r.id, revision: r.revision, kind: 'personal' }), 'INVALID_PAYLOAD');
  const changed = f.reserve('fleet', { id: r.id, revision: r.revision, spaceId: 'b3-3', name: 'Changed Guest', vehicle: { brand: 'Volvo', color: '#000000' } });
  assert.equal(changed.kind, 'fleet'); assert.equal(changed.owner, 'fleet'); assert.equal(changed.name, 'Changed Guest'); assert.equal(changed.revision, 2);
  assert.equal(f.s.attendance.length, 0);
  f.unchanged(() => f.reserve('admin', { id: changed.id, revision: changed.revision, kind: 'fleet' }), 'FORBIDDEN');
});
test('fleet retry is idempotent and rejects reused command with a different guest', () => {
  const f = setup(), context = { commandId: 'fleet-command-001' }, r = f.extra({}, 'fleet', context), version = f.s.version;
  const again = f.extra({}, 'fleet', context); assert.equal(again.id, r.id); assert.equal(f.s.version, version); assert.equal(f.s.reservations.length, 1);
  f.unchanged(() => f.extra({ name: 'Other Guest' }, 'fleet', context), 'COMMAND_REUSED');
  assert.equal(f.s.attendance.length, 0);
});
test('no-car and office cancellation preserve extras and only release personal rows', () => {
  for (const office of [true, false]) {
    const f = setup(), extra = f.extra({ start: '06:00', end: '23:00' }); f.reserve('fleet', { spaceId: 'b3-2' });
    const result = f.apply('fleet', 'attendanceSet', { dates: ['2026-10-14'], office, parking: false, start: '09:00', end: '10:00' });
    assert.deepEqual(f.s.reservations.map(r => r.id), [extra.id]); assert.equal(result.notifications.length, 1); assert.equal(result.notifications[0].spaceId, 'b3-2');
    assert.equal(f.s.attendance.length, office ? 1 : 0); if (office) assert.equal(f.s.attendance[0].start, '09:00');
  }
});
test('automatic parking keeps extras without treating them as personal parking or office hours', () => {
  const f = setup(), extra = f.extra({ start: '06:00', end: '23:00' });
  const result = f.apply('fleet', 'attendanceSet', { dates: ['2026-10-14'], office: true, parking: true, start: '09:00', end: '10:00' });
  assert.equal(result.result.days[0].status, 'reserved'); assert.equal(f.s.reservations.length, 2);
  assert.deepEqual(f.s.reservations.find(r => r.id === extra.id), extra); assert.equal(f.s.attendance[0].start, '09:00'); assert.equal(f.s.attendance[0].end, '10:00');
  f.apply('fleet', 'attendanceSet', { dates: ['2026-10-14'], office: true, parking: true, start: '08:00', end: '12:00' });
  assert.deepEqual(f.s.reservations.find(r => r.id === extra.id), extra); assert.equal(f.s.reservations.length, 2);
});
test('extra bookings cannot be offered transferred or swapped as either side', () => {
  const f = setup(), r = f.extra(), personal = f.reserve('a', { spaceId: 'b3-2' });
  f.unchanged(() => f.apply('fleet', 'offerCreate', { type: 'transfer', fromReservationId: r.id, to: 'a' }), 'FORBIDDEN');
  f.unchanged(() => f.apply('fleet', 'offerCreate', { type: 'swap', fromReservationId: r.id, toReservationId: personal.id, to: 'a' }), 'FORBIDDEN');
  f.unchanged(() => f.apply('a', 'offerCreate', { type: 'swap', fromReservationId: personal.id, toReservationId: r.id, to: 'fleet' }), 'FORBIDDEN');
  f.s.offers.push({ id: 'legacy-fleet-offer', from: 'fleet', to: 'a', type: 'transfer', fromReservationId: r.id, fromRevision: r.revision, status: 'pending', expiresAt: '2026-10-20T07:00:00.000Z' });
  f.unchanged(() => f.apply('a', 'offerRespond', { id: 'legacy-fleet-offer', response: 'accept' }), 'FORBIDDEN');
});
test('explicit denied access stops actor commands and reads without dropping booked capacity', () => {
  const f = setup(), r = f.extra({ floor: -1, spaceId: '' });
  f.apply('admin', 'memberSave', { id: 'fleet', access: false });
  assert.equal(f.s.members.find(m => m.id === 'fleet').active, true); assert.equal(f.s.members.find(m => m.id === 'fleet').access, false);
  f.unchanged(() => f.extra({ spaceId: 'b3-2' }), 'NOT_MEMBER');
  assert.throws(() => M.snapshot(f.s, { id: 'fleet' }, f.ctx), error('NOT_MEMBER'));
  assert.equal(M.poolAvailability(f.s, { id: 'fleet' }, { date: '2026-10-14' }, f.ctx).code, 'NOT_MEMBER');
  assert.equal(M.poolAvailability(f.s, { id: 'a' }, { date: '2026-10-14' }, f.ctx).available, 1);
  f.reserve('a', { floor: -1, spaceId: '' }); f.unchanged(() => f.reserve('b', { floor: -1, spaceId: '' }), 'CONFLICT');
  assert.ok(f.s.reservations.some(x => x.id === r.id));
});
test('revoked demoted fleet booking retains pooled capacity without blocking another eligible car', () => {
  const f = setup();
  f.s.config.slots.filter(s => s.floor === -1).forEach(s => s.allowedRoles = ['fleet', 'admin']);
  const r = f.extra({ floor: -1, spaceId: '' });
  Object.assign(f.s.members.find(m => m.id === 'fleet'), { access: false, role: 'office' });
  const request = { date: '2026-10-14', kind: 'fleet', start: '08:00', end: '12:00' };
  const preview = M.poolAvailability(f.s, { id: 'admin' }, request, f.ctx);
  assert.equal(preview.available, 1); assert.equal(preview.canReserve, true);
  f.unchanged(() => f.extra({ floor: -1, spaceId: '' }), 'NOT_MEMBER');
  f.extra({ floor: -1, spaceId: '', name: 'Second Car' }, 'admin');
  assert.equal(f.s.reservations.find(x => x.id === r.id).spaceId, r.spaceId);
  f.unchanged(() => f.extra({ floor: -1, spaceId: '', name: 'Third Car' }, 'admin'), 'CONFLICT');
  assert.equal(M.poolAvailability(f.s, { id: 'admin' }, request, f.ctx).available, 0);
});
test('typed independent access flag protects self access and fleet cannot promote administrators', () => {
  const f = setup();
  for (const access of ['false', 0, null]) f.unchanged(() => f.apply('admin', 'memberSave', { id: 'a', access }), 'INVALID_MEMBER');
  f.unchanged(() => f.apply('admin', 'memberSave', { id: 'admin', access: false }), 'FORBIDDEN');
  f.unchanged(() => f.apply('fleet', 'memberSave', { id: 'fleet', access: false }), 'FORBIDDEN');
  f.unchanged(() => f.apply('fleet', 'memberSave', { id: 'a', role: 'admin', access: true }), 'FORBIDDEN');
  f.apply('admin', 'memberSave', { id: 'a', access: false }); f.apply('admin', 'memberSave', { id: 'a', name: 'Updated' });
  assert.equal(f.s.members.find(m => m.id === 'a').access, false);
  f.apply('admin', 'memberSave', { id: 'a', access: true }); assert.equal(f.s.members.find(m => m.id === 'a').access, true);
});
test('trusted source profile owns role target and source line while access preserves vehicle', () => {
  const f = setup(); f.s.members.find(m => m.id === 'a').vehicle = { brand: 'Existing Car', color: '#111111' };
  const bindableMember = { id: 'a', name: 'Source Name', sourceLine: 'gyn', role: 'management', weeklyDays: 4 };
  f.apply('admin', 'memberSave', { id: 'a', name: 'Forged Name', role: 'office', weeklyDays: 0, sourceLine: 'gp', access: false }, { bindableMember });
  const member = f.s.members.find(m => m.id === 'a');
  assert.equal(member.name, 'Source Name'); assert.equal(member.role, 'management'); assert.equal(member.weeklyDays, 4); assert.equal(member.sourceLine, 'gyn'); assert.deepEqual(member.vehicle, { brand: 'Existing Car', color: '#111111' });
  f.unchanged(() => f.apply('admin', 'memberSave', { id: 'b', access: true }, { bindableMember }), 'INVALID_MEMBER');
  f.unchanged(() => f.apply('fleet', 'memberSave', { id: 'a', role: 'admin', access: true }, { bindableMember }), 'FORBIDDEN');
});
test('new members default denied while existing legacy access remains granted', () => {
  const f = setup();
  const added = f.apply('admin', 'memberSave', { id: 'new.user', name: 'New User', role: 'office', weeklyDays: 3 }).result;
  assert.equal(added.access, false); assert.equal(added.active, true);
  f.unchanged(() => f.reserve('new.user'), 'NOT_MEMBER');
  f.apply('admin', 'memberSave', { id: 'a', name: 'Legacy User' }); assert.equal(f.s.members.find(m => m.id === 'a').access, true);
  f.apply('admin', 'memberSave', { id: 'new.user', access: true }); f.reserve('new.user');
});
test('granting access reactivates a legacy inactive member while explicit activity and vehicle remain authoritative', () => {
  const f = setup(), member = f.s.members.find(m => m.id === 'a');
  member.active = false; member.access = false; member.vehicle = { brand: 'Existing Car', color: '#123abc' };
  f.apply('admin', 'memberSave', { id: 'a', access: true });
  assert.equal(f.s.members.find(m => m.id === 'a').active, true);
  assert.deepEqual(f.s.members.find(m => m.id === 'a').vehicle, { brand: 'Existing Car', color: '#123abc' });
  f.apply('admin', 'memberSave', { id: 'a', access: true, active: false });
  assert.equal(f.s.members.find(m => m.id === 'a').active, false);
  f.apply('admin', 'memberSave', { id: 'a', access: true }); f.reserve('a');
  f.apply('admin', 'memberSave', { id: 'a', access: false });
  assert.equal(f.s.members.find(m => m.id === 'a').active, true); assert.equal(f.s.reservations.length, 1);
});
test('admin and fleet can clean up revoked personal bookings while foreign active owners remain protected', () => {
  for (const manager of ['admin', 'fleet']) {
    const f = setup(), revoked = f.reserve('a'), active = f.reserve('b', { spaceId: 'b3-2' });
    f.unchanged(() => f.apply(manager, 'reservationCancel', { ids: [revoked.id] }), 'FORBIDDEN');
    f.apply('admin', 'memberSave', { id: 'a', access: false }); const attendance = JSON.stringify(f.s.attendance);
    f.unchanged(() => f.apply(manager, 'reservationCancel', { ids: [revoked.id, active.id] }), 'FORBIDDEN');
    f.apply(manager, 'reservationCancel', { ids: [revoked.id] });
    assert.equal(JSON.stringify(f.s.attendance), attendance); assert.deepEqual(f.s.reservations.map(r => r.id), [active.id]);
  }
});
test('admin cancellation frees a revoked creators extra without touching attendance and batches remain atomic', () => {
  const f = setup(), extra = f.extra(), personal = f.reserve('fleet', { spaceId: 'b3-2' });
  f.unchanged(() => f.apply('a', 'reservationCancel', { ids: [extra.id] }), 'FORBIDDEN');
  f.unchanged(() => f.apply('admin', 'reservationCancel', { ids: [extra.id] }), 'FORBIDDEN');
  f.apply('admin', 'memberSave', { id: 'fleet', access: false }); const attendance = JSON.stringify(f.s.attendance);
  f.apply('admin', 'reservationCancel', { ids: [extra.id] }); assert.equal(JSON.stringify(f.s.attendance), attendance); assert.equal(f.s.reservations[0].id, personal.id);
  const own = setup(), r = own.extra(); own.apply('fleet', 'reservationCancel', { ids: [r.id] }); assert.equal(own.s.reservations.length, 0);
});
console.log(`Garage fleet model: ${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;
