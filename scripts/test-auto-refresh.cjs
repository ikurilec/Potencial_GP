const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const tick=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};
(async()=>{
for(const file of ['app.js','nahlad/app.js']){
 const src=fs.readFileSync(file,'utf8');const store={};let resolve,fetches=0,settled=0,fresh=0;
 const ctx={dsRead:k=>store[k]||null,dsWrite:(k,v)=>{store[k]=v;},dsIsStale:()=>false,localStorage:{removeItem:k=>delete store[k]},Promise,JSON,Error};
 vm.createContext(ctx);vm.runInContext(src.slice(src.indexOf('var DataStore = (function'),src.indexOf('// ── PUSH NOTIFIKÁCIE')),ctx);
 ctx.DataStore.set('stocks',{products:[1]});
 const opts={fetcher:()=>{fetches++;return new Promise(r=>resolve=r);},onFresh:()=>fresh++,onSettled:()=>settled++};
 ctx.DataStore.refresh('stocks',opts);ctx.DataStore.refresh('stocks',opts);await tick();
 assert.equal(fetches,1,'Concurrent opens must share a request');resolve({products:[1]});await tick();
 assert.equal(fresh,0,'Unchanged data need no redraw');assert.equal(settled,2,file+': unchanged data must finish both spinners');
 let failed=0;
 ctx.DataStore.refresh('stocks',{fetcher:()=>Promise.reject(new Error('offline')),onSettled:meta=>{if(meta.error)failed++;}});await tick();
 assert.equal(failed,1);assert.deepEqual(ctx.DataStore.get('stocks').data,{products:[1]});
 let invalid=0;const invalidOpts={fetcher:()=>Promise.resolve(null),onSettled:m=>{if(m.error)invalid++;}};
 ctx.DataStore.refresh('stocks',invalidOpts);ctx.DataStore.refresh('stocks',invalidOpts);await tick();
 assert.equal(invalid,2,'Invalid responses must complete all subscribers and keep cached data');
 assert.deepEqual(ctx.DataStore.get('stocks').data,{products:[1]});
 let applied=0;
 ctx.DataStore.refresh('stocks',{fetcher:()=>Promise.resolve({products:[2]}),onFresh:()=>{throw Error('Broken view');},onSettled:()=>applied++});
 ctx.DataStore.refresh('stocks',{fetcher:()=>Promise.resolve({products:[2]}),onFresh:()=>applied++,onSettled:()=>applied++});await tick();
 assert.equal(applied,3,'One subscriber must not prevent the other view or spinners from finishing');
 // Sales revalidation keeps other quarters and selected period intact.
 let transportResolve,rendered=0,active=true;
 Object.assign(ctx,{PL_STATE:{year:2026,q:3,loaded:true,loading:false,data:{ok:true,value:1},qCache:{3:{data:{ok:true,value:1}},2:{data:{ok:true,value:9}}}},
 REP_PL_STATE:{},MGR_STATE:{subtab:'plnenie'},PL_PROD_SHEET_STATE:{open:false},appLineCapture:()=>({line:'gp'}),appLineContextActive:()=>active,
 getSession:()=>({username:'synthetic'}),plnenieCalendarPeriod:()=>({q:3,year:2026}),_plLsKey:(y,q)=>'sales-'+y+'-'+q,_plRepLsKey:(u,y,q)=>'rep-'+u+'-'+q,
 scriptUrl:p=>p,appFetchWithRetry:()=>new Promise(r=>transportResolve=r),
 plnenieBuildAggregates:d=>({value:d.value}),lbLastCompletedQ:()=>3,lbScopeReps:()=>[],
 plnenieRunSilentRender:fn=>fn(),plnenieRenderAll:()=>rendered++,repPlnenieRender:()=>rendered++,rp2Schedule:()=>{},
 document:{getElementById:()=>({classList:{contains:()=>true}})},dnesRefreshIfOpen:()=>{},prodSheetRenderRepList:()=>{}});
 vm.runInContext(src.slice(src.indexOf('function appCheckSalesQuarter('),src.indexOf('function appCheckHome()')),ctx);
 ctx.appCheckSalesQuarter(false);await tick();transportResolve({ok:true,value:2});await tick();
 assert.equal(ctx.PL_STATE.data.value,2);assert.equal(ctx.PL_STATE.qCache[2].data.value,9);assert.equal(rendered,1);
 ctx.PL_STATE.data={ok:true,value:1};ctx.PL_STATE.qCache[3]={data:ctx.PL_STATE.data};
 ctx.appCheckSalesQuarter(false);await tick();transportResolve({ok:true,value:2});await tick();
 assert.equal(ctx.PL_STATE.data.value,2,'Persisted fresh cache must repair stale memory even when server data are unchanged');
 ctx.appCheckSalesQuarter(false);await tick();ctx.PL_STATE.q=4;ctx.PL_STATE.data={ok:true,value:44};
 transportResolve({ok:true,value:3});await tick();
 assert.equal(ctx.PL_STATE.data.value,44,'Late response must not change the selected Q');
 assert.equal(ctx.PL_STATE.qCache[3].data.value,3);
 ctx.appCheckSalesQuarter(false);await tick();active=false;transportResolve({ok:true,value:88});await tick();
 assert.equal(ctx.PL_STATE.data.value,44,'Late response must not change another line');
 console.log(file+': DataStore completion and cache fallback passed');
}
})().catch(e=>{console.error(e);process.exit(1);});
