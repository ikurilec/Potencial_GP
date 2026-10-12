const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const tick=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
function take(s,name){const a=s.indexOf('function '+name+'('),b=s.indexOf('\nfunction ',a+1);assert.ok(a>=0,name);return s.slice(a,b);}
(async()=>{
 for(const file of ['app.js','nahlad/app.js']){
  const s=fs.readFileSync(file,'utf8');let epoch=1,owner='gp|admin',calls=[],pending=[];
  const c={Promise,IS_DEV:false,RP2_OV:{rows:{old:[['2608',100,10]]},loading:false},rp2Line:()=> 'gp',rp2Url_:()=> 'https://server/exec?action=getPharmaOverview',
   appLineCapture:()=>epoch,appLineContextActive:e=>e===epoch,appReadOwner:()=>owner,rp2Schedule:()=>{},
   appFetchWithRetry:(url,opts)=>{calls.push({url,opts});return new Promise((resolve,reject)=>pending.push({resolve,reject}));}};
  vm.createContext(c);vm.runInContext(take(s,'rp2LoadOv'),c);
  c.rp2LoadOv(true);assert.equal(calls.length,1,file+': manual retry must bypass old overview data');
  assert.ok(calls[0].url.includes('fresh=1'));assert.equal(calls[0].opts.priority,'critical');
  assert.ok(c.RP2_OV.rows.old,'Keep displayed overview data while refreshing');
  pending.shift().reject(Error('offline'));await tick();assert.ok(c.RP2_OV.rows.old,'Failure preserves the displayed benchmark');
  c.rp2LoadOv(true);pending.shift().resolve({ok:true,rows:[{p:'AFLsach',o:'KE',m:[['2609',200,20]]}]});await tick();
  assert.deepEqual(JSON.parse(JSON.stringify(c.RP2_OV.rows)),{'AFLsach|KE':[['2609',200,20]]});assert.equal(c.RP2_OV.loading,false);
  const before=calls.length;c.rp2LoadOv();assert.equal(calls.length,before,'Automatic warm returns reuse verified overview');
  c.rp2LoadOv(true);const old=pending.shift();c.rp2LoadOv(true);const newer=pending.shift();
  newer.resolve({ok:true,rows:[{p:'AFLsach',o:'KE',m:[['2610',300,30]]}]});await tick();old.resolve({ok:true,rows:[]});await tick();
  assert.equal(c.RP2_OV.rows['AFLsach|KE'][0][0],'2610','Late responses cannot overwrite a newer manual check');
  c.rp2LoadOv(true);const stale=pending.shift();epoch++;owner='gp|other';stale.resolve({ok:true,rows:[{p:'private-old-user',o:'KE',m:[]}]});await tick();
  c.rp2LoadOv();assert.equal(c.RP2_OV.rows,null,'A new login cannot use the previous account benchmark');
  pending.shift().reject(Error('offline'));await tick();assert.equal(c.RP2_OV.rows,null,'Initial failure remains retryable rather than caching a successful empty object');
  c.rp2LoadOv();pending.shift().resolve({ok:true,rows:[]});await tick();assert.deepEqual(Object.keys(c.RP2_OV.rows),[]);
  c.rp2Line=()=> 'reagila';const count=calls.length;c.rp2LoadOv(true);assert.equal(calls.length,count,'Reagila never calls the GP overview');
  console.log(file+': forced overview retry, cache preservation, generation/login guards and warm reuse passed');
 }
})().catch(e=>{console.error(e);process.exit(1);});
