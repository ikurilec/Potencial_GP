const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const src=fs.readFileSync('app.js','utf8');
function part(a,b){return src.slice(src.indexOf(a),src.indexOf(b,src.indexOf(a)));}
let view={key:'home-q3',type:'home',actions:['getPlnenieAll'],params:{rok:2026,Q:3}},requests=[];
const c={URL,location:{href:'https://test/'},getSession:()=>({username:'rep',role:'rep west',line:'gp'}),appLineTag:()=> 'gp',appLineCapture:()=>1,appLineContextActive:x=>x===1,localStorage:{getItem:()=>null,setItem:()=>{}},setTimeout:()=>1,clearTimeout:()=>{},document:{},Date,Promise};
vm.createContext(c);vm.runInContext(part('var APP_DATA_READ_ACTIONS','// ── Overovanie dát otvorenej sekcie'),c);
c.appReadView=()=>view;c.appReadBegin=()=>()=>{};
vm.runInContext(part('function appTrackedRead(', '// Indikátor zostáva'),c);
(async()=>{
 await c.appTrackedRead('https://server/exec?action=getPlnenieAll&rok=2026&Q=3',{},u=>{requests.push(u);return {ok:true,plan:{},predaje:{}};});
 assert.equal(new URL(requests[0]).searchParams.has('fresh'),false,'Automatic reads must reuse server cache instead of recomputing all Sheets');
 await c.appTrackedRead('https://server/exec?action=getPlnenieAll&rok=2026&Q=3&fresh=1',{},u=>{requests.push(u);return {ok:true,plan:{},predaje:{}};});
 assert.equal(new URL(requests[1]).searchParams.get('fresh'),'1','Explicit refresh must still bypass server cache');
 const q4=c.appReadResource('https://server/exec?action=getPlnenieAll&rok=2026&Q=4');c.appReadRemember(q4,Date.now(),true);
 assert.equal(c.appReadSummary(view).error,false,'Failed Q4 lookup must not mark displayed Q3 as failed');
 const hidden=c.appReadResource('https://server/exec?action=getPlnenieAll&rok=2026&Q=3&login=other');hidden.visible=false;c.appReadRemember(hidden,Date.now(),true);
 assert.equal(c.appReadSummary(view).error,false,'Background prefetch failures must not poison current screen');
 const real=c.appReadResource('https://server/exec?action=getPlnenieAll&rok=2026&Q=3');real.visible=true;c.appReadRemember(real,Date.now(),true);
 assert.equal(c.appReadSummary(view).error,true,'Actual failure of visible data must remain visible');
 c.appReadRemember(real,Date.now());assert.equal(c.appReadSummary(view).error,false,'Successful retry must recover the status');
 let trackedAttempts=0,untrackedAttempts=0;
 Object.assign(c,{appQueuedFetchJson:()=>{trackedAttempts++;return Promise.reject(Error('temporary'));},appQueuedFetchJsonUntracked:()=>{untrackedAttempts++;return untrackedAttempts===1?Promise.reject(Error('temporary')):Promise.resolve({ok:true});},setTimeout:fn=>{fn();return 1;}});
 vm.runInContext(part('function appFetchWithRetryRaw(', '// Registry retry'),c);
 const result=await c.appFetchWithRetryRaw('https://server/exec?action=getPlnenieAll',{retries:1});
 assert.equal(result.ok,true);assert.equal(trackedAttempts,0,'Intermediate retries must not record a final failure');assert.equal(untrackedAttempts,2);
 console.log('Automatic server cache, explicit fresh reads, scoped failures and retry recovery passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
