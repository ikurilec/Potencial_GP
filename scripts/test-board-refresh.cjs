const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const tick = async () => { for (let i=0;i<20;i++) await Promise.resolve(); };
function harness(file, responses) {
  const source = fs.readFileSync(file, 'utf8');
  const code = source.slice(source.indexOf('function nstFetch('), source.indexOf('// DEV — ukážkové príspevky', source.indexOf('function nstFetch(')));
  const calls=[]; let renders=0, home=0;
  const c={ NST:{posts:[{id:'cached'}],_reqId:0}, IS_DEV:false,
    nstUser:()=> 'rep', appLineCapture:()=>({line:'gp'}), appLineContextActive:()=>true,
    nstUrl:p=>p, APP_FETCH_TIMEOUT_MS:16000,
    appFetchJson:(url)=>{calls.push(url); const v=responses.shift(); return v instanceof Error ? Promise.reject(v) : Promise.resolve(v);},
    appQueuedFetchJson:(...a)=>c.appFetchJson(...a),
    nstApply:p=>{c.NST.posts=p;}, nstApplyPeople:()=>{}, nstUpdateBadge:()=>{},
    nstRenderList:()=>renders++, dnesRefreshIfOpen:()=>home++,
    clearTimeout:()=>{}, setTimeout:fn=>{queueMicrotask(fn); return 1;}, Date, Array, Error, navigator:{onLine:true}
  };
  vm.createContext(c); vm.runInContext(code,c);
  return {c,calls,get renders(){return renders;},get home(){return home;}};
}
(async()=>{
 for(const file of ['app.js','nahlad/app.js']) {
  const source=fs.readFileSync(file,'utf8');
  const list={innerHTML:'',querySelectorAll:()=>[]}; let retry;
  const ui={NST:{posts:[{id:'cached'}],err:'offline',loading:false},
    document:{getElementById:()=>list,activeElement:null}, nstFiltered:()=>ui.NST.posts,
    appRegisterRetry:(id,fn)=>{retry=fn;},appErrorCardHtml:o=>'<error>'+o.desc+'</error>',
    nstMentionHide:()=>{},nstPostHtml:p=>'<post>'+p.id+'</post>',setTimeout:()=>{},
    nstFocusPending:()=>{},nstFetch:()=>{},Array,Object};
  vm.createContext(ui);
  vm.runInContext(source.slice(source.indexOf('function nstRenderList(){'),source.indexOf('// Kostra príspevkov počas načítavania')),ui);
  ui.nstRenderList();
  assert.ok(list.innerHTML.includes('<error>'),'Cached posts must show refresh failure');
  assert.ok(list.innerHTML.includes('<post>cached</post>'),'Failure must preserve existing posts');
  assert.equal(typeof retry,'function');
  ui.NST.posts=[];ui.nstRenderList();assert.ok(list.innerHTML.includes('<error>'));
  const h=harness(file,[new Error('timeout'),{ok:true,posts:[{id:'latest'}]}]);
  let done=0; h.c.nstFetch(()=>done++,'critical',true); await tick();
  assert.equal(h.c.NST.posts[0].id,'latest',file+': cold-start retry must update cached posts');
  assert.notEqual(h.calls[0], h.calls[1], 'Retry must use a fresh request URL');
  assert.equal(h.calls.length,2); assert.equal(done,1); assert.equal(h.c.NST.loading,false);
  assert.ok(h.home>0,file+': Home must receive fresh board data');
  const fail=harness(file,[new Error('timeout'),new Error('timeout')]);
  fail.c.nstFetch(null,'critical',true); await tick();
  assert.ok(fail.c.NST.err,file+': failed refresh with cached posts must expose error');
  assert.equal(fail.c.NST.posts[0].id,'cached');
  const bad=harness(file,[{ok:false,error:'Session expired'}]);
  bad.c.nstFetch(null,'critical',true); await tick();
  assert.equal(bad.calls.length,1,'Do not retry denied sessions');
  assert.ok(bad.c.NST.err);
  const cancelled=harness(file,[]); let resolveCancelled; let cancelledDone=0;
  cancelled.c.appFetchJson=()=>new Promise(r=>resolveCancelled=r);
  cancelled.c.nstFetch(()=>cancelledDone++,'critical',true);
  cancelled.c.appLineContextActive=()=>false;
  resolveCancelled({ok:true,posts:[{id:'wrong-line'}]}); await tick();
  assert.equal(cancelled.c.NST.posts[0].id,'cached'); assert.equal(cancelledDone,0);
  const superseded=harness(file,[]); const pending=[];
  superseded.c.appFetchJson=()=>new Promise(r=>pending.push(r));
  superseded.c.nstFetch(null,'critical',true); superseded.c.nstFetch(null,'critical',true);
  pending[1]({ok:true,posts:[{id:'newer'}]}); await tick();
  pending[0]({ok:true,posts:[{id:'older'}]}); await tick();
  assert.equal(superseded.c.NST.posts[0].id,'newer');
  const slow=harness(file,[]); let resolveSlow; const timers=[];
  slow.c.setTimeout=(fn,ms)=>{timers.push({fn,ms});return timers.length;};
  slow.c.appFetchJson=()=>new Promise(r=>resolveSlow=r);
  slow.c.nstFetch(null,'critical',true); await tick();
  assert.equal(slow.c.NST.loading,true,'Keep spinner until request actually settles');
  assert.equal(timers.length,0,'No early watchdog may mark stale data as refreshed');
  resolveSlow({ok:true,posts:[{id:'latest'}]}); await tick();
  assert.equal(slow.c.NST.loading,false);
  const race=harness(file,[]); let resolve;
  race.c.appFetchJson=()=>new Promise(r=>resolve=r);
  race.c.nstFetch(null,'critical',true);
  race.c.nstFetch(null,'background');
  resolve({ok:true,posts:[{id:'latest'}]}); await tick();
  assert.equal(race.c.NST.posts[0].id,'latest',file+': background preload must not invalidate foreground');
 }
 console.log('Board refresh regression scenarios passed for both apps.');
})().catch(e=>{console.error(e);process.exit(1);});
