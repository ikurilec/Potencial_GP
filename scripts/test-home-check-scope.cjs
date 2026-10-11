const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function take(s,n){const a=s.indexOf('function '+n+'('),b=s.indexOf('\nfunction ',a+1);assert.ok(a>=0,n);return s.slice(a,b);}
for(const file of ['app.js','nahlad/app.js']){
 const s=fs.readFileSync(file,'utf8'),now=Date.now(),old=now-86400000;
 let epoch=1,user={username:'admin',role:'admin',line:'gp'};
 const c={URL,Date,Object,Array,Math,JSON,Number,Promise,location:{href:'https://app/'},
  getSession:()=>user,appLineTag:()=>user.line,appLineCapture:()=>({line:user.line,epoch}),appLineContextActive:x=>x.line===user.line&&x.epoch===epoch,
  localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>1,clearTimeout(){},document:{},
  plnenieDefaultPeriod:()=>({year:2026,q:3}),plnenieCalendarPeriod:()=>({year:2026,q:4}),lbLastCompletedQ:()=>4,gynLbLastCompletedQ:()=>4};
 vm.createContext(c);vm.runInContext(s.slice(s.indexOf('var APP_DATA_READ_ACTIONS'),s.indexOf('// ── Overovanie dát otvorenej sekcie')),c);
 const view={key:'home',type:'home',host:'#dnes-body',actions:['getPlnenieAll','getHistory','getStockData','getCalEvents','getNastenka'],params:{rok:2026,Q:3}};
 c.appReadView=()=>view;c.APP_READ_CHECKS={};c.APP_REQUEST_QUEUE={items:[],running:[]};
 const put=(query,ts,visible=true)=>{const r=c.appReadResource('https://server/exec?action='+query);r.visible=visible;c.appReadRemember(r,ts,false);return r;};
 put('getHistory&reprezentant=admin',old);put('getPlnenieAll&rok=2026&Q=3',old);
 put('getStockData',old);put('getNastenka',old);put('getCalEvents',old);
 for(const query of ['getPlnenieAll&rok=2026&Q=3','getPlnenieAll&rok=2026&Q=4','getStockData','getNastenka','getCalEvents'])put(query,now,false);
 assert.equal(c.appReadSummary(view).last,now,'Old history and previous foreground flags cannot pin fresh Home data to yesterday');
 let summary=c.appReadSummary(view);assert.equal(summary.groups.length,5);assert.ok(summary.groups.every(g=>g.last===now));
 c.appRole=()=> 'gp';c.mgrDetectRole=u=>u.role==='admin'?'admin':null;
 assert.equal(c.appReadSummary(view).groups.length,5,'Admin before shell classes are applied must never require personal GP history');
 const ranking=summary.groups.find(g=>g.id==='ranking');assert.match(ranking.label,/Q4/);
 const stock=c.appReadResource('https://server/exec?action=getStockData');c.APP_REQUEST_QUEUE.running=[{resource:stock}];
 assert.equal(c.appReadValid(c.appReadResource('https://server/exec?action=getHistory'),{ok:true}),false,'A malformed history response is not a successful check');
 assert.equal(c.appReadSummary(view).groups.find(g=>g.id==='stocks').pending,true,'Background in-flight work must be visible in the per-section status');
 c.APP_REQUEST_QUEUE.running=[];stock.visible=true;c.appReadRemember(stock,now+1000,true);
 assert.equal(c.appReadSummary(view).groups.find(g=>g.id==='stocks').error,true);assert.equal(c.appReadSummary(view).last,now,'Failure cannot advance the timestamp');
 const other=c.appReadResource('https://server/exec?action=getStockData');other.owner='another-user';c.APP_REQUEST_QUEUE.running=[{resource:other}];
 assert.equal(c.appReadSummary(view).groups.find(g=>g.id==='stocks').pending,false);c.APP_REQUEST_QUEUE.running=[];
 epoch++;user={...user,username:'new-admin'};assert.equal(c.appReadSummary(view).last,0,'Never reuse another account verification');
 vm.runInContext(take(s,'appHomeResume'),c);let checks=0;c.appCheckHome=()=>{checks++;};c.APP_HOME_CHECK_STARTED={};
 c.appHomeResume();c.appHomeResume();assert.equal(checks,1,'Resume/pageshow must request one fresh check, not just repaint yesterday');
 c.APP_HOME_CHECK_STARTED={};c.APP_REQUEST_QUEUE.running=[{resource:c.appReadResource('https://server/exec?action=getCalEvents')}];
 c.appHomeResume();assert.equal(checks,2,'An unrelated ongoing calendar poll cannot prevent checking the remaining Home sections on resume');
 c.APP_REQUEST_QUEUE.running=[];
 c.appReadView=()=>({...view,type:'stocks'});c.APP_HOME_CHECK_STARTED={};c.appHomeResume();assert.equal(checks,2,'Only resume the visible Home');
 console.log(file+': Home current resources, silent successes, per-section failures, account scope and deduplicated resume passed');
}
