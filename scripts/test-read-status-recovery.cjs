const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function take(s,name){const a=s.indexOf('function '+name+'('),b=s.indexOf('\nfunction ',a+1);assert.ok(a>=0);return s.slice(a,b);}
(async()=>{
for(const file of ['app.js','nahlad/app.js']){
 const s=fs.readFileSync(file,'utf8'),store=new Map();let epoch=1,user={username:'admin',role:'admin',line:'gp'};
 const c={URL,location:{href:'https://app/'},Date,Promise,Object,Array,Math,JSON,Error,Number,
  getSession:()=>user,appLineTag:()=>user.line,appLineCapture:()=>({line:user.line,epoch}),appLineContextActive:x=>x.epoch===epoch&&x.line===user.line,
  localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},setTimeout:()=>1,clearTimeout:()=>{},document:{}};
 vm.createContext(c);vm.runInContext(s.slice(s.indexOf('var APP_DATA_READ_ACTIONS'),s.indexOf('// ── Overovanie dát otvorenej sekcie')),c);
 const view={key:'home',type:'home',actions:['getStockData','getPlnenieAll'],params:{rok:2026,Q:3}};
 c.APP_READ_CHECKS={};c.appReadView=()=>view;c.appReadPaint=()=>{};
 vm.runInContext(take(s,'appReadBegin')+take(s,'appTrackedRead')+take(s,'appReadTimeout'),c);
 const url='https://server/exec?action=getStockData';
 await c.appTrackedRead(url,{},()=>Promise.reject(Error('timeout')),'critical').catch(()=>{});
 assert.equal(c.APP_READ_CHECKS.home.error,true,'A genuine visible failure must be shown');
 await c.appTrackedRead(url,{},()=>Promise.resolve({ok:true,rows:[]}),'background');
 assert.equal(c.appReadSummary(view).error,false);
 assert.equal(c.APP_READ_CHECKS.home.error,false,'Successful background recovery must clear the failed foreground check');
 let releaseVisible;
 const visible=c.appTrackedRead(url,{},()=>new Promise(r=>releaseVisible=r),'critical');
 await c.appTrackedRead(url,{},()=>Promise.reject(Error('offline')),'background').catch(()=>{});
 assert.equal(c.appReadSummary(view).error,true,'An overlapping background subscriber cannot hide the failure of the visible read');
 releaseVisible({ok:false,error:'offline'});await visible;
 assert.equal(c.appReadSummary(view).error,true);
 await c.appTrackedRead(url,{},()=>Promise.resolve({ok:true,rows:[]}),'background');
 assert.equal(c.appReadSummary(view).error,false);
 await c.appTrackedRead(url,{},()=>Promise.reject(Error('offline')),'critical').catch(()=>{});
 await c.appTrackedRead(url,{},()=>Promise.reject(Error('offline')),'background').catch(()=>{});
 assert.equal(c.appReadSummary(view).error,true,'Another failed background attempt cannot erase the genuine visible failure');
 const old=c.APP_READ_CHECKS.home;
 await c.appTrackedRead('https://server/exec?action=getPlnenieAll&rok=2026&Q=3',{},()=>{assert.equal(old.pending,0,'Deferred boot dependencies must not reopen the Home spinner');return {ok:true,plan:{},predaje:{}};},'boot');
 assert.ok(c.appReadTimeout(url,12000)>=30000,'Stock reads must tolerate a normal cold Apps Script execution');
 assert.ok(c.appReadTimeout('https://server/exec?action=getCalEvents',12000)>=30000,'Calendar reads must tolerate the same cold server');
 for(const action of ['getRepList','getReps','getInitData','getHistory','getAllHistory'])assert.ok(c.appReadTimeout('https://server/exec?action='+action,12000)>=30000,'The same cold-server budget applies to '+action);
 vm.runInContext(take(s,'appQueuePriority'),c);
 assert.equal(c.appQueuePriority({prio:'background',resource:c.appReadResource(url)}),0,'Home background card reads must leave a slot for the explicit check');
 assert.equal(c.appQueuePriority({prio:'critical',resource:c.appReadResource(url)}),2,'The explicit Home check remains foreground');
 let managerRequests=[],configCallback;
 const manager={...c,IS_DEV:false,PL_STATE:{q:3,year:2026,loading:false,loaded:false,_loadId:0,qCache:{}},
  _plLsLoad:()=>null,_plLsKey:(y,q)=>y+'_'+q,plnenieBuildAggregates:()=>({}),plnenieUpdateQTabs:()=>{},plnenieRenderSummaryEmpty:()=>{},plnenieRenderLoading:()=>{},plnenieRenderAll:()=>{},dnesRefreshIfOpen:()=>{},
  scriptUrl:q=>q,mgrFetchWithRetry:u=>{managerRequests.push(u);return new Promise(()=>{});},plnenieDataTsFetch:cb=>{configCallback=cb;},appCheckSalesQuarter:()=>{},appLineCapture:()=>({line:'gp',epoch:1}),appLineContextActive:()=>true};
 vm.createContext(manager);vm.runInContext(take(s,'plnenieLoadAllQuarters'),manager);manager.plnenieLoadAllQuarters();
 assert.equal(managerRequests.length,1,'Selected manager data must start without waiting for optional Config metadata');
 assert.equal(new URLSearchParams(managerRequests[0]).get('Q'),'3');assert.equal(typeof configCallback,'function');
 let selectedDone;
 const rep={...manager,DataStore:{set:()=>true},REP_PL_STATE:{q:3,year:2026,loading:false,_loadId:0,qCache:{}},
  _plRepLsKey:(u,y,q)=>u+y+q,document:{getElementById:()=>({classList:{contains:()=>false}})},repPlnenieUpdateNavBtn:()=>{},repPlnenieRender:()=>{},
  mgrFetchWithRetry:u=>new URLSearchParams(u).get('Q')==='3'?new Promise(r=>selectedDone=r):new Promise(()=>{})};
 vm.createContext(rep);vm.runInContext(take(s,'appReadBatch')+take(s,'repPlnenieLoad'),rep);rep.repPlnenieLoad();
 for(let i=0;i<25;i++)await Promise.resolve();
 assert.equal(rep.REP_PL_STATE._currentLoading,true);selectedDone({ok:true,plan:{},predaje:{}});
 for(let i=0;i<25;i++)await Promise.resolve();
 assert.equal(rep.REP_PL_STATE.loaded,true);assert.equal(rep.REP_PL_STATE.loading,true,'Historical preload remains independent');
 assert.equal(rep.REP_PL_STATE._currentLoading,false,'Selected quarter must complete before all historical preloads');
 c.appReadView=()=>({type:'sales',actions:['getConfig']});
 assert.equal(c.appQueuePriority({prio:'background',resource:c.appReadResource('https://server/exec?action=getConfig&key=notif_predaje')}),0,'Optional metadata must not occupy both foreground slots on other screens');
 console.log(file+': visible failure, background recovery, boot isolation and cold Home read budgets passed');
}
})().catch(e=>{console.error(e);process.exit(1);});
