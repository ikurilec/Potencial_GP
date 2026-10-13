'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const modelPath = path.resolve(__dirname, '../garage-model.js');
assert.ok(fs.existsSync(modelPath), 'Garage domain model must exist');
const M = require(modelPath);
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('PASS ' + name); }
function setup() {
  const s = M.createState();
  s.members = [
    { id: 'user.a', name: 'User A', role: 'office', weeklyDays: 3, active: true },
    { id: 'user.b', name: 'User B', role: 'office', weeklyDays: 4, active: true },
    { id: 'user.c', name: 'User C', role: 'office', weeklyDays: 3, active: true },
    { id: 'admin', name: 'Admin', role: 'admin', weeklyDays: 3, active: true }
  ];
  let id = 0;
  const ctx = { today: '2026-10-12', now: '2026-10-12T07:00:00.000Z', id: () => 'id-' + (++id) };
  const a = { id: 'user.a', role: 'office' }, b = { id: 'user.b', role: 'office' }, c = { id: 'user.c', role: 'office' }, admin = { id: 'admin' };
  const apply = (actor, cmd, p, extra) => M.apply(s, actor, cmd, p, Object.assign({}, ctx, extra));
  const reserve = (actor, p = {}) => apply(actor, 'reservationSave', Object.assign({ date: '2026-10-13', spaceId: 'b3-1', start: '08:00', end: '12:00' }, p)).result;
  return { s, ctx, a, b, c, admin, apply, reserve };
}
function error(code) { return e => e.code === code && !!e.message; }
test('rolling thirty calendar dates survive month and year boundaries', () => {
  assert.deepEqual(M.windowFor('2026-10-12'), { start: '2026-10-12', end: '2026-11-10' });
  assert.deepEqual(M.windowFor('2026-12-31'), { start: '2026-12-31', end: '2027-01-29' });
  assert.throws(() => M.windowFor('2026-02-30'), error('INVALID_DATE'));
});
test('temporary eight spaces, no public staff seeds', () => {
  const s = M.createState(); assert.equal(s.members.length, 0); assert.equal(s.config.slots.length, 8);
  assert.deepEqual(s.config.slots.map(x => x.floor), [-3,-3,-3,-3,-3,-3,-1,-1]);
});
test('same space and same person overlaps rejected, touching intervals allowed', () => {
  const f = setup(); f.reserve(f.a);
  assert.throws(() => f.reserve(f.b, { start: '11:59' }), error('CONFLICT'));
  assert.throws(() => f.reserve(f.a, { spaceId: 'b3-2' }), error('CONFLICT'));
  f.reserve(f.b, { start: '12:00', end: '16:30' });
  assert.equal(f.s.reservations.length, 2);
});
test('invalid date and interval never mutate state', () => {
  const f = setup(), before = JSON.stringify(f.s);
  for (const p of [{ date: '2026-10-11' }, { date: '2026-11-11' }, { date: '2026-13-01' }]) assert.throws(() => f.reserve(f.a, p), error(p.date === '2026-13-01' ? 'INVALID_DATE' : 'DATE_WINDOW'));
  for (const p of [{start:'12:00',end:'12:00'},{start:'08:70'},{end:'25:00'}]) assert.throws(() => f.reserve(f.a,p),error('INVALID_TIME'));
  assert.equal(JSON.stringify(f.s), before);
});
test('attendance batch independent and parking implies attendance', () => {
  const f = setup(); f.apply(f.a,'attendanceSet',{dates:['2026-10-12','2026-10-13'],office:true});
  assert.equal(f.s.attendance.length,2); assert.equal(f.s.reservations.length,0);
  f.reserve(f.b); assert.ok(f.s.attendance.some(x=>x.owner==='user.b'));
  const before=JSON.stringify(f.s); assert.throws(()=>f.apply(f.a,'attendanceSet',{dates:['2026-10-14','2026-11-11'],office:true}),error('DATE_WINDOW'));
  assert.equal(JSON.stringify(f.s),before);
});
test('attendance cancellation releases own parking and not other users', () => {
  const f=setup(); f.reserve(f.a); f.reserve(f.b,{spaceId:'b3-2'});
  const r=f.apply(f.a,'attendanceSet',{dates:['2026-10-13'],office:false});
  assert.equal(f.s.reservations.length,1); assert.equal(f.s.reservations[0].owner,'user.b');
  assert.equal(r.notifications[0].type,'release'); assert.equal(r.notifications[0].audience,'all');
});
test('parking-only cancellation retains attendance and batch is atomic',()=>{
  const f=setup(), a=f.reserve(f.a), b=f.reserve(f.b,{spaceId:'b3-2'}), before=JSON.stringify(f.s);
  assert.throws(()=>f.apply(f.a,'reservationCancel',{ids:[a.id,b.id]}),error('FORBIDDEN')); assert.equal(JSON.stringify(f.s),before);
  f.apply(f.a,'reservationCancel',{ids:[a.id]}); assert.ok(f.s.attendance.some(x=>x.owner===f.a.id));
});
test('failed reservation edit preserves originals and revisions',()=>{
  const f=setup(), a=f.reserve(f.a); f.reserve(f.b,{spaceId:'b3-2'}); const before=JSON.stringify(f.s);
  assert.throws(()=>f.reserve(f.a,{id:a.id,revision:a.revision,spaceId:'b3-2'}),error('CONFLICT')); assert.equal(JSON.stringify(f.s),before);
  const moved=f.reserve(f.a,{id:a.id,revision:a.revision,date:'2026-10-14'}); assert.equal(moved.revision,2);
  assert.throws(()=>f.reserve(f.a,{id:a.id,revision:1,date:'2026-10-15'}),error('STALE'));
});
test('authoritative membership cannot be forged through actor roles',()=>{
  const f=setup(); assert.throws(()=>f.apply({id:'user.a',role:'admin'},'configSave',{defaultStart:'09:00'}),error('FORBIDDEN'));
  assert.throws(()=>f.apply({id:'stranger',role:'admin'},'reservationSave',{date:'2026-10-13',spaceId:'b3-1'}),error('NOT_MEMBER'));
});
test('slot restrictions and blocks enforced for reservation',()=>{
  const f=setup(); f.apply(f.admin,'configSave',{slots:f.s.config.slots.map(x=>x.id==='b3-1'?Object.assign({},x,{allowedMembers:['user.a']}):x)});
  assert.throws(()=>f.reserve(f.b),error('RESTRICTED'));
  f.apply(f.admin,'blockSave',{date:'2026-10-13',spaceId:'b3-1',start:'08:00',end:'09:00',reason:'Service'});
  assert.throws(()=>f.reserve(f.a),error('CONFLICT')); f.reserve(f.a,{start:'09:00'});
});
test('configuration cannot disable allocated spaces or add colliding blocks',()=>{
  const f=setup(); f.reserve(f.a); const before=JSON.stringify(f.s);
  assert.throws(()=>f.apply(f.admin,'configSave',{slots:f.s.config.slots.filter(x=>x.id!=='b3-1')}),error('SLOT_IN_USE')); assert.equal(JSON.stringify(f.s),before);
  assert.throws(()=>f.apply(f.admin,'blockSave',{date:'2026-10-13',spaceId:'b3-1',start:'09:00',end:'10:00'}),error('CONFLICT'));
});
test('pending transfer preserves reservation; only recipient can accept',()=>{
  const f=setup(), a=f.reserve(f.a), offer=f.apply(f.a,'offerCreate',{type:'transfer',fromReservationId:a.id,to:f.b.id}).result;
  assert.equal(f.s.reservations[0].owner,f.a.id); assert.equal(f.s.offers[0].status,'pending');
  assert.throws(()=>f.apply(f.c,'offerRespond',{id:offer.id,response:'accept'}),error('FORBIDDEN'));
  f.apply(f.b,'offerRespond',{id:offer.id,response:'accept'}); assert.equal(f.s.reservations[0].owner,f.b.id);
  assert.ok(f.s.attendance.some(x=>x.owner===f.a.id)); assert.ok(f.s.attendance.some(x=>x.owner===f.b.id));
});
test('swap exchanges owners atomically and respects recipient allocation collisions',()=>{
  const f=setup(), a=f.reserve(f.a), b=f.reserve(f.b,{spaceId:'b3-2'});
  const offer=f.apply(f.a,'offerCreate',{type:'swap',fromReservationId:a.id,to:f.b.id,toReservationId:b.id}).result;
  f.apply(f.b,'offerRespond',{id:offer.id,response:'accept'});
  assert.equal(f.s.reservations.find(x=>x.id===a.id).owner,f.b.id); assert.equal(f.s.reservations.find(x=>x.id===b.id).owner,f.a.id);
});
test('changed, expired and newly colliding transfer offers cannot steal spaces',()=>{
  const f=setup(), a=f.reserve(f.a), offer=f.apply(f.a,'offerCreate',{type:'transfer',fromReservationId:a.id,to:f.b.id}).result;
  f.reserve(f.a,{id:a.id,revision:1,end:'11:30'}); const before=JSON.stringify(f.s);
  assert.throws(()=>f.apply(f.b,'offerRespond',{id:offer.id,response:'accept'}),error('STALE')); assert.equal(JSON.stringify(f.s),before);
  const g=setup(), r=g.reserve(g.a), o=g.apply(g.a,'offerCreate',{type:'transfer',fromReservationId:r.id,to:g.b.id,expiresAt:'2026-10-12T08:00:00Z'}).result;
  assert.throws(()=>g.apply(g.b,'offerRespond',{id:o.id,response:'accept'},{now:'2026-10-12T08:01:00Z'}),error('EXPIRED'));
  const h=setup(), r2=h.reserve(h.a), o2=h.apply(h.a,'offerCreate',{type:'transfer',fromReservationId:r2.id,to:h.b.id}).result; h.reserve(h.b,{spaceId:'b3-2'});
  const original=JSON.stringify(h.s); assert.throws(()=>h.apply(h.b,'offerRespond',{id:o2.id,response:'accept'}),error('CONFLICT')); assert.equal(JSON.stringify(h.s),original);
});
test('waitlist is owned, one record per date and never reserves implicitly',()=>{
  const f=setup(); f.apply(f.a,'waitlistSet',{date:'2026-10-13',start:'08:00',end:'12:00',enabled:true});
  f.apply(f.a,'waitlistSet',{date:'2026-10-13',start:'09:00',end:'12:00',enabled:true}); assert.equal(f.s.waitlist.length,1); assert.equal(f.s.reservations.length,0);
  f.apply(f.a,'waitlistSet',{date:'2026-10-13',enabled:false}); assert.equal(f.s.waitlist.length,0);
});
test('idempotency returns original result without revision or notification duplication',()=>{
  const f=setup(), p={date:'2026-10-13',spaceId:'b3-1',start:'08:00',end:'12:00'}, first=f.apply(f.a,'reservationSave',p,{commandId:'command-0001'}), before=JSON.stringify(f.s);
  const retry=f.apply(f.a,'reservationSave',p,{commandId:'command-0001'}); assert.deepEqual(retry.result,first.result); assert.equal(retry.duplicate,true); assert.deepEqual(retry.notifications,[]); assert.equal(JSON.stringify(f.s),before);
  assert.throws(()=>f.apply(f.a,'reservationSave',Object.assign({},p,{end:'13:00'}),{commandId:'command-0001'}),error('COMMAND_REUSED'));
  assert.throws(()=>f.apply(f.a,'reservationSave',p,{commandId:'bad'}),error('INVALID_COMMAND_ID'));
});
test('members, audit and snapshots exclude server state and private offers',()=>{
  const f=setup(); f.apply(f.admin,'memberSave',{id:'user.c',role:'fleet',weeklyDays:4,active:true});
  const a=f.reserve(f.a); f.apply(f.a,'offerCreate',{type:'transfer',fromReservationId:a.id,to:f.b.id});
  const snap=M.snapshot(f.s,f.c,f.ctx); assert.equal(snap.me.canAdmin,true); assert.equal(snap.me.role,'fleet'); assert.equal(snap.offers.length,1); assert.ok(snap.audit.length);
  const ordinary=M.snapshot(f.s,{id:'user.c'},f.ctx); assert.equal(ordinary.dedup,undefined); assert.equal(ordinary.outbox,undefined);
  f.apply(f.admin,'memberSave',{id:'user.c',role:'office',weeklyDays:4,active:true}); const clean=M.snapshot(f.s,f.c,f.ctx); assert.equal(clean.offers.length,0); assert.equal(clean.audit.length,0);
});
test('own vehicle profile is validated and included in snapshots',()=>{
  const f=setup(); f.apply(f.a,'memberProfileSave',{vehicle:{brand:'  Sample car  ',color:'#AaBbCc'}});
  assert.deepEqual(M.snapshot(f.s,f.a,f.ctx).me.vehicle,{brand:'Sample car',color:'#aabbcc'});
  const before=JSON.stringify(f.s);
  assert.throws(()=>f.apply(f.a,'memberProfileSave',{vehicle:{brand:'Example',color:'red'}}),error('INVALID_VEHICLE'));
  assert.throws(()=>f.apply(f.a,'memberProfileSave',{vehicle:{brand:'x'.repeat(61),color:'#aabbcc'}}),error('INVALID_VEHICLE'));
  assert.equal(JSON.stringify(f.s),before);
  assert.throws(()=>f.apply(f.a,'memberProfileSave',{id:f.b.id,vehicle:{brand:'Example',color:'#aabbcc'}}),error('FORBIDDEN'));
  f.apply(f.admin,'memberSave',{id:f.b.id,vehicle:{brand:'Other',color:'#ffffff'},weeklyDays:4});
  assert.equal(M.snapshot(f.s,f.b,f.ctx).me.vehicle.brand,'Other');
});
test('parking extension does not announce a release and shortening announces only freed intervals',()=>{
  const f=setup(), r=f.reserve(f.a);
  const longer=f.apply(f.a,'reservationSave',{id:r.id,revision:r.revision,date:r.date,spaceId:r.spaceId,start:'07:30',end:'13:00'});
  assert.equal(longer.notifications.length,0);
  const shorter=f.apply(f.a,'reservationSave',{id:r.id,revision:2,date:r.date,spaceId:r.spaceId,start:'08:00',end:'12:00'});
  assert.deepEqual(shorter.notifications.map(x=>[x.start,x.end]),[['07:30','08:00'],['12:00','13:00']]);
});
test('manual attendance can shorten its hours while still covering own parking',()=>{
  const f=setup();f.apply(f.a,'attendanceSet',{dates:['2026-10-13'],office:true,start:'08:00',end:'16:30'});
  f.apply(f.a,'attendanceSet',{dates:['2026-10-13'],office:true,start:'09:00',end:'12:00'});
  assert.deepEqual([f.s.attendance[0].start,f.s.attendance[0].end],['09:00','12:00']);
  f.reserve(f.a,{start:'08:30',end:'13:00'});f.apply(f.a,'attendanceSet',{dates:['2026-10-13'],office:true,start:'10:00',end:'11:00'});
  assert.deepEqual([f.s.attendance[0].start,f.s.attendance[0].end],['08:30','13:00']);
});
test('member deactivation cannot orphan future parking and becomes possible after owner cancellation',()=>{
  const f=setup(),r=f.reserve(f.a),before=JSON.stringify(f.s);
  assert.throws(()=>f.apply(f.admin,'memberSave',{id:f.a.id,role:'office',active:false,weeklyDays:3}),error('MEMBER_IN_USE'));assert.equal(JSON.stringify(f.s),before);
  f.apply(f.a,'reservationCancel',{ids:[r.id]});f.apply(f.admin,'memberSave',{id:f.a.id,role:'office',active:false,weeklyDays:3});
  assert.equal(f.s.members.find(x=>x.id===f.a.id).active,false);
});
console.log(`${passed} Garage model tests passed`);
