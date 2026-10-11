const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
(async()=>{for(const file of ['app.js','nahlad/app.js']){
 const s=fs.readFileSync(file,'utf8');let epoch=1,user={username:'admin',role:'admin',line:'gp'},now=1000000,view=null,calls=0;
 class Clock extends Date{static now(){return now;}}
 const c={URL,URLSearchParams,Date:Clock,Object,Array,Math,JSON,Number,Promise,location:{href:'https://app/'},
 getSession:()=>user,appLineTag:()=>user.line,appLineCapture:()=>({line:user.line,epoch}),appLineContextActive:x=>x.line===user.line&&x.epoch===epoch,
 localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>1,clearTimeout(){},document:{}};
 vm.createContext(c);vm.runInContext(s.slice(s.indexOf('var APP_DATA_READ_ACTIONS'),s.indexOf('// ── Overovanie dát otvorenej sekcie')),c);
 c.appReadView=()=>view;c.appReadSchedulePaint=()=>{};c.APP_READ_CHECKS={};c.APP_MANUAL_REFRESH_UNTIL=0;
 vm.runInContext(s.slice(s.indexOf('function appTrackedRead('),s.indexOf('// Indikátor zostáva aktívny')),c);
 assert.equal(typeof c.appReadReuse,'function','Recent successful reads need safe session reuse');
 const read=(action,params='')=>c.appTrackedRead('https://server/exec?action='+action+params,{},()=>{calls++;return Promise.resolve(action==='getHistory'?[]:{ok:true,rows:[{name:'Cache'}],posts:[],events:[],summary:[],okresy:[],plan:{},predaje:{}});},'background');
 for(const line of ['gp','gyn','reagila'])for(const role of ['admin','boss','bum','am west','am east','rep west','gyn-rep','kam']){
  user={username:'same-login',role,line};epoch++;
  const before=calls;let a=await read('getLekarne','&login=rep-a&creamMonth=202610');a.rows[0].name='Mutated by renderer';now+=100;
  const checked=c.appReadLast(c.appReadResource('https://server/exec?action=getLekarne&login=rep-a&creamMonth=202610'));
  const b=await read('getLekarne','&login=rep-a&creamMonth=202610');assert.equal(calls,before+1,'Immediate return should reuse a successful read');assert.equal(b.rows[0].name,'Cache','Caller mutations must not alter saved responses');
  assert.equal(c.appReadLast(c.appReadResource('https://server/exec?action=getLekarne&login=rep-a&creamMonth=202610')),checked,'Cache reuse cannot invent a new verification time');
  await read('getLekarne','&login=rep-b&creamMonth=202610');assert.equal(calls,before+2,'Another colleague requires a different read');
  await read('getLekarne','&login=rep-a&creamMonth=202611');assert.equal(calls,before+3,'Another month requires a different read');
  c.APP_MANUAL_REFRESH_UNTIL=now+15000;await read('getLekarne','&login=rep-a&creamMonth=202610');assert.equal(calls,before+4,'Explicit pull/retry must use the network');c.APP_MANUAL_REFRESH_UNTIL=0;
  c.appReadInvalidate('action=setLekarenKremContact');await read('getLekarne','&login=rep-a&creamMonth=202610');assert.equal(calls,before+5,'A write must invalidate recent reads');
  c.appReadInvalidate('action=logUsage');await read('getLekarne','&login=rep-a&creamMonth=202610');assert.equal(calls,before+5,'Telemetry must not invalidate current data');
  now+=300001;await read('getLekarne','&login=rep-a&creamMonth=202610');assert.equal(calls,before+6,'Older reads must revalidate');
 }
 await read('getNastenka');let before=calls;now+=1000;await read('getNastenka');assert.equal(calls,before);now+=30001;await read('getNastenka');assert.equal(calls,before+1,'Collaborative updates have a shorter reuse window');
 before=calls;epoch++;await read('getNastenka');assert.equal(calls,before+1,'New session epoch must verify again');
 before=calls;await read('getPharmaData','&produkt=CAV&oblast=KE&kvartal=2603&graf=0');await read('getPharmaData','&produkt=CAV&oblast=KE&kvartal=2603&graf=1');assert.equal(calls,before+2,'Graph completeness flags must not share a response');
 before=calls;await read('getLekarne','&newDataFilter=1');await read('getLekarne','&newDataFilter=1');assert.equal(calls,before+2,'Unknown data parameters must disable reuse safely');
 c.appReadInvalidate('action=nastenkaLike');before=calls;await read('getNastenka');assert.equal(calls,before+1,'Board mutations invalidate recent replies');
 let finish;const late=c.appTrackedRead('https://server/exec?action=getHistory',{},()=>new Promise(r=>finish=r));c.appReadInvalidate('action=saveOverride');finish([]);await late;before=calls;await read('getHistory');assert.equal(calls,before+1,'A pre-write response cannot restore the old cache after invalidation');
 const bad='https://server/exec?action=getStockData';let attempts=0;
 await c.appTrackedRead(bad,{},()=>{attempts++;return Promise.resolve({ok:false,error:'Failed'});});
 await c.appTrackedRead(bad,{},()=>{attempts++;return Promise.resolve({ok:true,rows:[]});});assert.equal(attempts,2,'Failed reads must not be reused');
 epoch++;now+=10;view={key:'away',type:'stocks',actions:['getStockData'],params:{},path:'https://server/exec'};c.appReadBegin=()=>()=>{};
 let releaseAway;const away=c.appTrackedRead(bad,{},()=>new Promise(r=>releaseAway=r));view=null;releaseAway({ok:true,rows:[]});await away;
 assert.equal(c.appReadLast(c.appReadResource(bad)),now,'A valid read completed during navigation keeps its actual verification time');
 console.log(file+': 24 role/line sessions, recent reuse, scoped keys, immutable payloads, original timestamps, expiry, manual refresh, writes and failures passed');
}})().catch(e=>{console.error(e);process.exitCode=1;});
