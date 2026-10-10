const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const src=fs.readFileSync('app.js','utf8');
function take(name,next){const i=src.indexOf('function '+name+'(');return src.slice(i,src.indexOf(next,i));}
// Report market requests must use the foreground slot, even with preloads queued.
const actions=src.slice(src.indexOf('var actions={plnenie:')).match(/reporty:\[([^\]]+)\]/)[1];
assert.ok(actions.includes("'getPharmaData'"),'Report market data is incorrectly relegated to background');
async function run(mode){
 let epoch=1,region='KE',scheduled=0,timers=[],pending=[];
 const c={Promise,Date,setTimeout:(fn,ms)=>{const t={fn,ms};timers.push(t);return t;},clearTimeout:t=>{timers=timers.filter(x=>x!==t);},
 RPT_VIEW:{scope:'rep',pharmaLoadedOblasts:{}},RP2_LAST:{m:null},PHARMA_STATE:{cache:{}},PHARMA_GRAF_STATE:{cache:{}},
 appLineCapture:()=>epoch,appLineContextActive:x=>x===epoch,appReadOwner:()=> 'gp|manager',
 rptViewPeriod:()=>({year:2026,q:3}),rptViewScopeReps:()=>['rep'],rptViewOblasts:()=>[region],
 rptViewCodeForPlanKey:x=>x,pharmaKvartalCode:()=>2603,pharmaGrafCacheKey:(a,b)=>a+'_'+b,
 pharmaDataRequestUrl:(a,b)=>a+'_'+b,rp2Schedule:()=>scheduled++,
 appFetchWithRetry:()=> (mode==='hang'||mode==='stale')?new Promise(r=>pending.push(r)):mode==='fail'?Promise.reject(new Error('offline')):Promise.resolve({ok:true,summary:[],okresy:[]})};
 vm.createContext(c);vm.runInContext(src.slice(src.indexOf('function rptViewPharmaReadyForScope('),src.indexOf('function rptViewAnimateBars(')),c);
 const model={prods:[{key:'A',g100:10},{key:'B',g100:10},{key:'C',g100:10}]};c.RP2_LAST.m=model;
 c.rptViewEnsurePharma(model);await flush();
 if(mode==='ok'){assert.equal(c.RPT_VIEW.pharmaLoading,false);assert.equal(c.rptViewPharmaReadyForScope(),true);}
 if(mode==='fail'){assert.equal(c.RPT_VIEW.pharmaLoading,false);assert.equal(c.rptViewPharmaReadyForScope(),false);assert.ok(c.RPT_VIEW.pharmaError);}
 if(mode==='stale'){
  region='BA';c.rptViewEnsurePharma(model);await flush();assert.equal(pending.length,6);
  pending.slice(0,3).forEach(r=>r({ok:true,summary:[],okresy:[]}));await flush();assert.equal(Object.keys(c.PHARMA_STATE.cache).length,0);
  pending.slice(3).forEach(r=>r({ok:true,summary:[],okresy:[]}));await flush();assert.equal(c.RPT_VIEW.pharmaLoading,false);assert.equal(Object.keys(c.PHARMA_STATE.cache).length,3);assert.ok(Object.keys(c.PHARMA_STATE.cache).every(k=>k.includes('_BA_')));
 }
 if(mode==='hang'){
  assert.equal(c.RPT_VIEW.pharmaLoading,true);const watchdog=timers.find(t=>t.ms>=30000&&t.ms<=60000);assert.ok(watchdog,'Queue wait needs a bounded deadline');watchdog.fn();await flush();
  assert.equal(c.RPT_VIEW.pharmaLoading,false);assert.ok(c.RPT_VIEW.pharmaError);assert.equal(c.rptViewPharmaReadyForScope(),false);
  pending.forEach(r=>r({ok:true,summary:[],okresy:[]}));await flush();assert.equal(Object.keys(c.PHARMA_STATE.cache).length,0,'Expired responses must not overwrite cache');
 }
 return scheduled;
}
async function flush(){for(let i=0;i<12;i++)await Promise.resolve();}
(async()=>{await run('ok');await run('fail');await run('hang');await run('stale');console.log('Report market foreground routing, success, failure and queue timeout passed');})().catch(e=>{console.error(e);process.exitCode=1;});
