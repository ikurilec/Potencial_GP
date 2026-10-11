const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
for(const file of ['app.js','nahlad/app.js']){
 const s=fs.readFileSync(file,'utf8');let epoch=1,user={username:'test-user',role:'admin',line:'gp'},view;
 const c={URL,Date,Object,Array,Math,JSON,Number,Promise,location:{href:'https://app/'},
  getSession:()=>user,appLineTag:()=>user.line,appLineCapture:()=>({line:user.line,epoch}),appLineContextActive:x=>x.line===user.line&&x.epoch===epoch,
  localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>1,clearTimeout(){},document:{}};
 vm.createContext(c);vm.runInContext(s.slice(s.indexOf('var APP_DATA_READ_ACTIONS'),s.indexOf('// ── Overovanie dát otvorenej sekcie')),c);
 c.appReadView=()=>view;c.APP_READ_CHECKS={};c.APP_REQUEST_QUEUE={items:[],running:[]};
 const put=(query,ts,failed=false)=>{const r=c.appReadResource('https://server/exec?action='+query);r.visible=true;c.appReadRemember(r,ts,failed);return r;};
 const cases=[['stocks','getStockData'],['board','getNastenka'],['calendar','getCalEvents'],['sales','getPlnenieAll'],['team','getTeamPlnenie'],['market','getPharmaData'],['district-chart','getPharmaOkresGraf'],['districts','getPharmaData'],['pharmacies','getLekarne'],['pharmacy-detail','getLekarneDetail'],['gyn-lekarne','getGynLekarne'],['history','getHistory'],['ranking','getPlnenieAll'],['mgr-visits','getAllHistory'],['mgr-activity','getUsageStats'],['gyn-activity','getUsageStats'],['mgr-reporty','getPlnenieAll'],['gyn-reporty','getPlnenieAll'],['product','getPlnenieAll'],['tuyory','getTuyory'],['lonelix','getLonelix'],['apixaban','getApixaban'],['navigator','getNastenka']];
 for(const line of ['gp','gyn','reagila'])for(const role of ['admin','boss','bum','am west','am east','rep west','gyn-rep','kam'])for(const [type,action] of cases){
  user={...user,role,line};epoch++;c.APP_READ_META={};view={key:type,type,actions:[action],params:{},path:'https://server/exec'};
  let summary=c.appReadSummary(view);assert.ok(Array.isArray(summary.groups),type+' must expose read sections');
  assert.equal(summary.groups[0].state,'unknown','Unverified data must not be green');
  const r=put(action,1000);summary=c.appReadSummary(view);assert.equal(summary.groups[0].state,'verified');assert.equal(summary.last,1000);
  c.APP_REQUEST_QUEUE.running=[{resource:r}];summary=c.appReadSummary(view);assert.equal(summary.groups[0].state,'pending');assert.equal(summary.last,1000);
  c.APP_REQUEST_QUEUE.running=[];put(action,2000,true);summary=c.appReadSummary(view);assert.equal(summary.groups[0].state,'error');assert.equal(summary.last,1000);
  put(action,3000);assert.equal(c.appReadSummary(view).groups[0].state,'verified');
 }
 user={username:'test-user',role:'admin',line:'gp'};epoch++;c.APP_READ_META={};
 view={key:'districts',type:'districts',actions:['getPharmaData','getConfig'],params:{oblast:'KE',kvartal:['2603','2602']},path:'https://server/exec'};
 put('getPharmaData&oblast=KE&kvartal=2603&produkt=AFLcrm',1000);
 put('getPharmaData&oblast=KE&kvartal=2603&produkt=CAV',2000,true);
 let summary=c.appReadSummary(view);assert.equal(summary.groups.length,2,'Batch products require independent status rows');assert.equal(summary.error,true,'Another product success cannot hide a failure');
 put('getPharmaData&oblast=KE&kvartal=2603&produkt=CAV',3000);assert.equal(c.appReadSummary(view).error,false);
 put('getPharmaData&oblast=KE&kvartal=2601&produkt=SUP',4000,true);assert.equal(c.appReadSummary(view).groups.length,2,'A different period is excluded');
 view={key:'pharmacies',type:'pharmacies',actions:['getLekarne','getLekarneVariants'],params:{login:'colleague'},path:'https://server/exec'};c.APP_READ_META={};
 put('getLekarne&login=colleague',1000);put('getLekarneVariants&login=another',2000,true);assert.equal(c.appReadSummary(view).groups.length,1,'Another colleague must not leak into the status');
 console.log(file+': 552 line/role/view states, neutral unknowns, batch isolation, scoped failures and recovery passed');
}
