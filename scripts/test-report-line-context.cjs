'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
function take(name) {
  const begin = src.indexOf('function ' + name + '(');
  assert.ok(begin >= 0, 'Missing ' + name);
  const end = src.indexOf('\nfunction ', begin + 1);
  return src.slice(begin, end < 0 ? undefined : end).split('\n//')[0];
}
const names = ['rp2LoadCennik', 'rp2LoadAbs', 'rp2DohLoad'];
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
function fixture() {
  let line = 'gp', user = 'manager', epoch = 0, schedules = 0;
  const pending = [];
  const c = {
    IS_DEV: false, Date, console,
    RP2: { ceny: null, cenyRep: {}, cenyLoading: false, cenyErr: false },
    RP2_ABS: { events: null, loading: false, err: false },
    RP2_DOH: { list: null, loading: false, err: false, draft: null, busy: false },
    RP2_LAST: { m: null, p: null }, _rp2Timer: null, clearTimeout,
    appLineCapture: () => ({ line, epoch }),
    appLineContextActive: ctx => ctx.line === line && ctx.epoch === epoch,
    appReadOwner: () => line + '|' + user + '|am west',
    rp2Line: () => line,
    gynScriptUrl: action => line + ':' + action,
    rp2Url_: action => line + ':' + action,
    gynCalScriptUrl: action => line + ':' + action,
    gynCalNormEvent: e => e,
    rp2Schedule: () => { schedules++; },
    appQueuedFetchJson: url => new Promise((resolve, reject) => { pending.push({url,resolve,reject}); }),
    appFetchWithRetry: (url, opts) => new Promise((resolve, reject) => { pending.push({ url, opts, resolve, reject }); })
  };
  vm.createContext(c);
  for (const name of ['rp2ResetReadState', 'rp2ReadStart']) if (src.includes('function ' + name + '(')) vm.runInContext(take(name), c);
  names.concat(['rp2DohSave','rp2DohDel']).forEach(name => vm.runInContext(take(name), c));
  return { c, pending, schedules: () => schedules, switchLine(next) { line = next; epoch++; }, switchUser(next) { user = next; }, bumpEpoch() { epoch++; } };
}
const payload = marker => ({ ok: true, ceny: { marker }, ceny_rep: { marker }, events: [{ owner: marker }], dohody: [{ rep: marker }] });
function marker(c, index) { return index === 0 ? c.RP2.ceny && c.RP2.ceny.marker : index === 1 ? c.RP2_ABS.events && c.RP2_ABS.events[0]?.owner : c.RP2_DOH.list && c.RP2_DOH.list[0]?.rep; }
function loading(c, index) { return index === 0 ? c.RP2.cenyLoading : index === 1 ? c.RP2_ABS.loading : c.RP2_DOH.loading; }
async function run() {
  for (const change of ['line','account','epoch']) for (const failed of [false,true]) {
    const f=fixture();f.c.rp2ReadStart();let callbacks=0;
    f.c.rp2DohSave({id:'old'},()=>{callbacks++;f.c.RP2_DOH.draft=null;});
    if(change==='line')f.switchLine('reagila');if(change==='account')f.switchUser('new');if(change==='epoch')f.bumpEpoch();
    f.c.rp2ReadStart();f.c.RP2_DOH.list=[{id:'new'}];f.c.RP2_DOH.draft={id:'new'};f.c.RP2_DOH.busy=true;
    const schedules=f.schedules();if(failed)f.pending[0].reject(new Error('late'));else f.pending[0].resolve({ok:true,dohoda:{id:'old'}});await flush();
    assert.equal(callbacks,0,'Late save must not invoke callback in new '+change);assert.equal(f.c.RP2_DOH.draft.id,'new');assert.equal(f.c.RP2_DOH.list.length,1);assert.equal(f.c.RP2_DOH.busy,true);assert.equal(f.schedules(),schedules);
  }
  for(const failed of [false,true]){
    const f=fixture();f.c.rp2DohDel('same-id');f.switchLine('reagila');f.c.rp2ReadStart();f.c.RP2_DOH.list=[{id:'same-id'}];const n=f.schedules();
    if(failed)f.pending[0].reject(new Error('late'));else f.pending[0].resolve({ok:true});await flush();assert.equal(f.c.RP2_DOH.list.length,1);assert.equal(f.schedules(),n);
  }
  {const f=fixture();let confirm;f.c.lkConfirm=(a,b,c,run)=>confirm=run;f.c.rp2DohDel('old');f.switchLine('reagila');confirm();assert.equal(f.pending.length,0,'Delete confirmation cannot submit against newly selected line');}
  {const f=fixture();let done=0;f.c.rp2DohSave({id:'ok'},()=>done++);f.pending[0].resolve({ok:true,dohoda:{id:'ok'}});await flush();assert.equal(done,1);assert.equal(f.c.RP2_DOH.list[0].id,'ok');f.c.rp2DohDel('ok');f.pending[1].resolve({ok:true});await flush();assert.equal(f.c.RP2_DOH.list.length,0);}
  console.log('PASS agreement save/delete reject stale account,line,epoch,confirmation and callbacks; same-context writes retained');
  for (const [index, name] of names.entries()) {
    for (const change of ['line', 'account', 'epoch']) {
      const f = fixture(); f.c[name]();
      if (change === 'line') f.switchLine('reagila');
      if (change === 'account') f.switchUser('other-manager');
      if (change === 'epoch') f.bumpEpoch();
      f.c[name]();
      assert.equal(f.pending.length, 2, name + ': new ' + change + ' context must start its own request');
      f.pending[0].resolve(payload('previous'));
      await flush();
      assert.equal(marker(f.c, index), null, name + ': stale success cannot write new context');
      assert.equal(loading(f.c, index), true, name + ': stale success cannot release new request loading');
      assert.equal(f.schedules(), 0, name + ': stale success cannot repaint');
      f.pending[1].resolve(payload('current')); await flush();
      assert.equal(marker(f.c, index), 'current');
      assert.equal(loading(f.c, index), false);
      console.log('PASS ' + name + ' rejects previous ' + change + ' response');
    }
    const f = fixture(); f.c[name](); f.c[name]();
    assert.equal(f.pending.length, 1, name + ': same-context loading stays deduplicated');
    f.pending[0].resolve(payload('cached')); await flush();
    f.c[name](); f.pending[1].reject(new Error('offline')); await flush();
    assert.equal(marker(f.c, index), 'cached', name + ': same-context failed refresh preserves cache');
    assert.equal(loading(f.c, index), false);
    console.log('PASS ' + name + ' preserves same-context deduplication and offline refresh fallback');
    const g = fixture(); g.c[name](); g.switchLine('reagila'); g.c[name]();
    g.pending[0].reject(new Error('old request failed')); await flush();
    assert.equal(loading(g.c, index), true, name + ': stale failure cannot release new loading');
    assert.equal(g.schedules(), 0, name + ': stale failure cannot repaint');
    g.pending[1].resolve(payload('current')); await flush();
    assert.equal(marker(g.c, index), 'current');
    console.log('PASS ' + name + ' rejects stale failure');
  }
  if (src.includes('function rp2ResetReadState(')) {
    const f = fixture(); names.forEach(name => f.c[name]());
    f.pending.forEach(p => p.resolve(payload('old'))); await flush();
    f.c.RP2_DOH.draft = { private: true }; f.c.RP2_LAST.m = { private: true };
    f.c.rp2ResetReadState();
    assert.equal(f.c.RP2.ceny, null); assert.equal(f.c.RP2_ABS.events, null); assert.equal(f.c.RP2_DOH.list, null);
    assert.equal(f.c.RP2_DOH.draft, null); assert.equal(f.c.RP2_LAST.m, null);
    assert.match(take('mgrLineResetSharedData'), /rp2ResetReadState\(\)/, 'Line switch must clear retained report state');
    console.log('PASS line reset clears retained report data, loading and draft');
    const g = fixture(); g.c.rp2LoadAbs(); g.c.rp2ResetReadState(); g.c.rp2LoadAbs();
    g.pending[1].resolve(payload('new-generation')); await flush();
    g.pending[0].resolve(payload('old-generation')); await flush();
    assert.equal(marker(g.c, 1), 'new-generation', 'Explicit reset must invalidate old callbacks even if account/line/epoch match again');
    console.log('PASS explicit reset invalidates previous request generation');
  }
  new vm.Script(src);
}
run().catch(error => { console.error(error); process.exitCode = 1; });
