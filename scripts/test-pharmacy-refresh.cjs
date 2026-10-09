const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const src=fs.readFileSync('app.js','utf8');
const c={lkCurrentYearMonth:()=>({rok:2026,mesiac:10}),lkIsReagila:()=>false,lkOpportunityProducts:()=>[],lkDobropisMeta:()=>({count:0,total:0}),lkNorm:x=>x,LK_PROD_DISPLAY:{},LK_MES_NAMES:['','Jan','Feb','Mar','Apr','Máj','Jún','Júl','Aug','Sep','Okt','Nov','Dec'],lkEsc:x=>x};vm.createContext(c);
vm.runInContext(src.slice(src.indexOf('function lkCreamLast3('),src.indexOf('// In-flight callbacks')),c);
vm.runInContext(src.slice(src.indexOf('function lkBuildLekarne('),src.indexOf('// Otvorenie lekárne overlay (rep)')),c);
const row=(mes,qty,name='A')=>({login:'rep',rok:'2026',mesiac:String(mes),okres:'KE',mesto:'KE',lekaren:name,prods:{aflamil_kr:qty}});
const pharmacies=c.lkBuildLekarne([row(6,4),row(7,5),row(8,6),row(8,2),row(8,9,'B')]);
assert.deepEqual(Array.from(pharmacies[0].krmLast3,x=>x.qty),[4,5,8],'Use latest report month and sum duplicate months; no unimported Sep/Oct zeroes');
assert.deepEqual(Array.from(pharmacies[1].krmLast3,x=>x.qty),[0,0,9],'Same report window for every pharmacy; actual missing purchases remain zero');
assert.match(c.lkCreamSummaryHtml ? c.lkCreamSummaryHtml(pharmacies[0],'reaktivacia') : c.lkCreamLast3Text(pharmacies[0].krmLast3),/Aug: 8/);
const december=c.lkBuildLekarne([{...row(12,3),rok:2025},{...row(1,2),rok:2026}]);assert.deepEqual(Array.from(december[0].krmLast3,x=>[x.rok,x.mesiac,x.qty]),[[2025,11,0],[2025,12,3],[2026,1,2]]);
console.log('Pharmacy report window, month normalization, duplicate sums and year rollover passed');
// A late IndexedDB result must not replace the response just received from Sheets.
(async()=>{
 let releaseCache,releaseNetwork;let delivered=[],cache={};
 const x={IS_DEV:false,_lkInFlight:{},LK_STATE:{cache},lkCacheKey:v=>v,lkGetCachedRows:()=>null,lkIdbSupported:()=>true,lkIdbLoad:()=>new Promise(r=>releaseCache=r),lkCreamContactMonthKey:()=>'',scriptUrl:v=>v,appReadView:()=>({actions:['getLekarne']}),appQueuedFetchJson:(url,opts,t,p)=>{assert.match(url,/fresh=1/);assert.equal(p,'critical');return new Promise(r=>releaseNetwork=r)},lkReconcileCreamContactLocal:()=>{},lkSetCache:(key,rows)=>{cache[key]={rows};return true}};
 vm.createContext(x);vm.runInContext(src.slice(src.indexOf('function lkFetch(login, cb) {'),src.indexOf('function lkFetchFresh(')),x);
 x.lkFetch('rep',rows=>delivered.push(rows));releaseNetwork({ok:true,rows:[{fresh:true}]});await new Promise(r=>setImmediate(r));releaseCache({rows:[{old:true}]});await new Promise(r=>setImmediate(r));
 assert.equal(delivered.length,1);assert.equal(cache.rep.rows[0].fresh,true);console.log('Late IndexedDB cannot overwrite fresh pharmacy data');
})().catch(e=>{console.error(e);process.exitCode=1});
// Activity must be measured at the latest uploaded report, not unimported calendar months.
const lagged=c.lkBuildLekarne([{...row(1,1),prods:{aflamil_tb:5}},{...row(5,7),prods:{aflamil_kr:7}},{...row(8,0),prods:{aflamil_tb:8}}]);
assert.equal(lagged[0].isSleeping,false,'August-active pharmacy must not become sleeping merely because today is October');
assert.equal(lagged[0].isReaktivacia,true,'Cream reactivation candidate must survive a lagging report');
