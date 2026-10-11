const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('app.js','utf8');
const take=(name,next)=>src.slice(src.indexOf('function '+name+'('),src.indexOf(next,src.indexOf('function '+name+'(')));
let epoch=1,owner='gp|rep',timers=[],calls=[];
const c={Date,Array,PHARMA_CODES:{test:['T']},_PROD_INSIGHT_PRELOAD_TS:{},
 appLineCapture:()=>({epoch}),appLineContextActive:x=>x.epoch===epoch,appReadOwner:()=>owner,
 pharmaKvartalCode:()=>2602,plnenieNormalizeKey:x=>x,setTimeout:fn=>timers.push(fn),
 loadPharmaDataNetwork:()=>calls.push('data'),loadPharmaGrafDataFresh:()=>calls.push('graph'),plnenieProductInsightMaybeRefresh:()=>{},plnenieEnsureInsightPharmaLoaded:()=>calls.push('cached')};
vm.createContext(c);vm.runInContext(take('plneniePreloadProductInsights','function plnenieProductInsightHtml'),c);
c.plneniePreloadProductInsights('west',2,2026,['test'],true);epoch++;timers.splice(0).forEach(fn=>fn());
assert.equal(calls.length,0,'Old line timers must not download data into the new line');
owner='reagila|manager';c.plneniePreloadProductInsights('west',2,2026,['test'],true);timers.splice(0).forEach(fn=>fn());
assert.deepEqual(calls,['data'],'Another account/line has its own preload gate');
class June extends Date {constructor(...a){super(...(a.length?a:['2026-06-10T12:00:00Z']));}}
let quarters=[],pending=[];
const d={Date:June,Promise,GYN_APP:{year:2026,q:2,plCache:{},plLoading:{},_plReqIds:{}},
 appLineCapture:()=>({}),appLineContextActive:()=>true,gynPlnenieCacheKey:(y,q)=>y+'_'+q,
 gynCacheRead:k=>k.endsWith('_4')?{ok:true,cached:true}:null,gynPreprocessData:()=>{},dsRead:()=>null,GYN_CACHE_PREFIX:'gyn_',DataStore:{set:()=>true},
 gynScriptUrl:x=>x,APP_FETCH_TIMEOUT_PRELOAD_MS:12000,dnesRefreshIfOpen:()=>{},gynRefreshAllTrends:()=>{},
 appQueuedFetchJson:u=>{quarters.push(Number(new URLSearchParams(u).get('Q')));return new Promise(r=>pending.push(r));}};
vm.createContext(d);vm.runInContext(take('appReadBatch','// Registry retry')+take('gynPreloadAllQuarters','// Preload rebríčka'),d);
async function flush(){for(let i=0;i<30;i++)await Promise.resolve();}
(async()=>{
 d.gynPreloadAllQuarters();await flush();assert.deepEqual(quarters,[2],'Only one automatic quarter read is queued at once');
 assert.ok(d.GYN_APP.plCache[4],'Restore cached future quarters without downloading them');
 pending.shift()({ok:true,plan:{},predaje:{}});await flush();assert.deepEqual(quarters,[2,1],'Selected quarter is first and future quarters are skipped');
 pending.shift()({ok:true,plan:{},predaje:{}});await flush();
 quarters=[];d.GYN_APP.year=2025;d.GYN_APP.plLoading={};d.gynPreloadAllQuarters();await flush();
 for(let i=0;i<4;i++){pending.shift()({ok:true,plan:{},predaje:{}});await flush();}
 assert.deepEqual(quarters,[2,1,3,4],'Past-year trends still have all four quarters');
 console.log('Scoped combined market preload and bounded selected/elapsed-quarter preloads passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
