const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const src = fs.readFileSync('app.js', 'utf8');
function take(name, next) { const a = src.indexOf('function ' + name + '('); assert.ok(a >= 0, name); return src.slice(a, src.indexOf(next, a)); }
async function flush() { for (let i = 0; i < 35; i++) await Promise.resolve(); }
async function unchangedGraph() {
  let reply, callbacks = 0;
  const data = { ok:true, rows:[{mesiac:'2609',terit_ms:5}] }, cache = {trend:{data}};
  const c = {Promise, JSON, Date, IS_DEV:false, PHARMA_GRAF_STATE:{cache:{},loading:{}},
    PHARMA_GRAF_WAITERS:{}, dsRead:k=>cache[k], dsWrite:(k,d)=>{cache[k]=d;}, dsIsStale:()=>true,
    appLineCapture:()=>1, appLineContextActive:()=>true, appReadOwner:()=> 'gp|rep',
    pharmaGrafCacheKey:()=> 'A_KE', _pgLsKey:()=> 'trend', pharmaGrafRequestUrl:()=> 'url',
    appQueuedFetchJson:()=>new Promise(r=>{reply=r;})};
  vm.createContext(c);
  vm.runInContext(src.slice(src.indexOf('var DataStore ='), src.indexOf('// Metadata úspešnej')), c);
  vm.runInContext(take('pharmaGrafAddWaiter','var PHARMA_OKRES_STATE'),c);
  vm.runInContext(take('loadPharmaGrafDataFresh','function fillGrafChart'),c);
  c.loadPharmaGrafDataFresh('A','KE',()=>callbacks++);
  await flush(); c.loadPharmaGrafDataFresh('A','KE',()=>callbacks++);
  reply(data); await flush();
  assert.equal(callbacks,2,'An unchanged successful graph reply must finish every waiting consumer');
  assert.equal(Object.keys(c.PHARMA_GRAF_STATE.loading).length,0);
}
async function obsoleteStore() {
  let epoch=1, reply, notified=0; const cache={};
  const c={Promise,JSON,dsRead:k=>cache[k],dsWrite:(k,d)=>cache[k]=d,dsIsStale:()=>true,
    appLineCapture:()=>epoch,appLineContextActive:x=>x===epoch,appReadOwner:()=> 'gp|rep'};
  vm.createContext(c);vm.runInContext(src.slice(src.indexOf('var DataStore ='),src.indexOf('// Metadata úspešnej')),c);
  c.DataStore.refresh('same',{fetcher:()=>new Promise(r=>reply=r),onFresh:()=>notified++});await flush();
  epoch=2; c.DataStore.refresh('same',{fetcher:()=>Promise.resolve({ok:true,newAccount:true}),onFresh:()=>notified++});await flush();
  reply({ok:true,oldAccount:true});await flush();
  assert.equal(cache.same.data.newAccount,true,'An obsolete response must not overwrite the current account cache');
  assert.equal(notified,1,'Only the current context may receive committed data');
}
function immediateMarketCache() {
  let render=0;const old={ok:true,summary:[{mesiac:'2608'}],okresy:[]};
  const c={Promise,PHARMA_STATE:{cache:{},loading:{},activeCode:'A',oblast:'KE',kvartal:'2603'},
    appLineCapture:()=>1,appLineContextActive:()=>true,appReadOwner:()=> 'gp|rep',
    pharmaRender:()=>render++,pharmaRevalidate:()=>{},pharmaNeedsPrevDistrictFetch:()=>true,
    pharmaAttachPrevDistrictsForCurrent:()=>{},_phLsLoad:()=>old,aflamilFamilyMaybeRefresh:()=>{}};
  vm.createContext(c);vm.runInContext(take('loadPharmaData','function loadPharmaDataNetwork'),c);
  c.loadPharmaData('A','KE','2603');assert.equal(render,1,'Cached market overview must render before historical enrichment');
}
async function boundedPreload() {
  let pending=[],calls=[],epoch=1;
  const c={Promise,Date,setTimeout:fn=>fn(),PHARMA_CODES:{a:['A'],b:['B'],c:['C']},
    PHARMA_STATE:{cache:{},loading:{}},PHARMA_GRAF_STATE:{cache:{},loading:{}},_PROD_INSIGHT_PRELOAD_TS:{},
    appLineCapture:()=>epoch,appLineContextActive:x=>x===epoch,appReadOwner:()=> 'gp|rep',
    pharmaKvartalCode:()=> '2603',plnenieNormalizeKey:x=>x,
    loadPharmaDataNetwork:code=>{calls.push(code);return new Promise(r=>pending.push(r));},
    loadPharmaGrafDataFresh:()=>{throw Error('Combined reads must not start a separate graph transfer');},
    pharmaGrafCacheKey:(a,b)=>a+'_'+b,plnenieProductInsightMaybeRefresh:()=>{}};
  vm.createContext(c);vm.runInContext(take('plneniePreloadProductInsights','function plnenieProductInsightHtml'),c);
  c.plneniePreloadProductInsights('KE',3,2026,['a','b','c'],true);await flush();
  assert.deepEqual(calls,['A'],'Prefetch must start one product, reserving a slot for navigation');
  pending.shift()();await flush();assert.deepEqual(calls,['A','B']);
  epoch=2;pending.shift()();await flush();assert.deepEqual(calls,['A','B'],'Changing accounts/lines must stop remaining prefetches');
}
async function boundedBatchAndCacheScopes(){
 let active=true,pending=[],started=0,finished=0,owner='gp|admin';
 const c={Promise,appReadOwner:()=>owner,pharmaGrafCacheKey:(a,b)=>a+'_'+b,_PH_LS_V:'v2',_PG_LS_V:'v2'};
 vm.createContext(c);vm.runInContext(take('appReadBatch','// Registry retry'),c);
 const batch=c.appReadBatch(Array.from({length:24},(_,i)=>i),()=>{started++;return new Promise(r=>pending.push(r));},{concurrency:2,active:()=>active});
 await flush();assert.equal(started,2,'A large batch must not flood the two-slot scheduler');
 pending.shift()();finished++;await flush();assert.equal(started,3);
 active=false;pending.forEach(r=>r());await batch;assert.equal(started,3,'Canceled batch must not produce any more tasks');
 vm.runInContext(take('pharmaPersistentScope','function _phLsLoad'),c);
 const before=[c._phLsKey('CAV','KE','2603'),c._pgLsKey('CAV','KE')];owner='reagila|admin';
 assert.notEqual(c._phLsKey('CAV','KE','2603'),before[0]);assert.notEqual(c._pgLsKey('CAV','KE'),before[1]);
 owner='gp|rep';assert.notEqual(c._phLsKey('CAV','KE','2603'),before[0],'Different roles/accounts must not reuse an unscoped market cache');
}
(async()=>{await unchangedGraph();await obsoleteStore();immediateMarketCache();await boundedPreload();await boundedBatchAndCacheScopes();console.log('Unchanged completion, account isolation, immediate cache, bounded combined preloads and scoped persistent market caches passed');})().catch(e=>{console.error(e);process.exitCode=1;});
