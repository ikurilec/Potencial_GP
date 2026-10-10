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
assert.deepEqual(calls,['data','graph'],'Another account/line has its own preload gate');
class June extends Date {constructor(...a){super(...(a.length?a:['2026-06-10T12:00:00Z']));}}
let quarters=[];const d={Date:June,Promise,GYN_APP:{year:2026,q:2,plCache:{},plLoading:{},_plReqIds:{}},
 appLineCapture:()=>({}),appLineContextActive:()=>true,gynPlnenieCacheKey:(y,q)=>y+'_'+q,
 gynCacheRead:k=>k.endsWith('_4')?{cached:true}:null,gynPreprocessData:()=>{},
 gynScriptUrl:x=>x,APP_FETCH_TIMEOUT_PRELOAD_MS:12000,appQueuedFetchJson:u=>{quarters.push(Number(new URLSearchParams(u).get('Q')));return new Promise(()=>{});}};
vm.createContext(d);vm.runInContext(take('gynPreloadAllQuarters','// Preload rebríčka'),d);d.gynPreloadAllQuarters();
assert.deepEqual(quarters,[2,1],'Fetch the selected quarter first and skip future quarters');
assert.ok(d.GYN_APP.plCache[4],'Restore cached future quarters without downloading them');
quarters=[];d.GYN_APP.year=2025;d.GYN_APP.plLoading={};d.gynPreloadAllQuarters();assert.deepEqual(quarters,[2,1,3,4],'Past-year trends still have all four quarters');
console.log('Deferred market reads respect account/line changes; Gyn preloads selected/elapsed quarters and retain full past-year history');
