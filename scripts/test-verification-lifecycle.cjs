'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
(async()=>{for(const file of ['app.js','nahlad/app.js']){
 const src=fs.readFileSync(file,'utf8');let user,epoch=0,now=1000000,calls=0,view;
 class Clock extends Date{static now(){return now;}}
 const c={Date:Clock,URL,URLSearchParams,Object,Array,JSON,Math,Number,Promise,location:{href:'https://app/'},getSession:()=>user,appLineTag:()=>user.line,appLineCapture:()=>({line:user.line,epoch}),appLineContextActive:x=>x.line===user.line&&x.epoch===epoch,localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>1,clearTimeout(){},document:{},plnenieDefaultPeriod:()=>({year:2026,q:3}),plnenieCalendarPeriod:()=>({year:2026,q:4}),lbLastCompletedQ:()=>4,gynLbLastCompletedQ:()=>4};
 vm.createContext(c);vm.runInContext(src.slice(src.indexOf('var APP_DATA_READ_ACTIONS'),src.indexOf('// ── Overovanie dát otvorenej sekcie')),c);c.APP_READ_CHECKS={};c.APP_REQUEST_QUEUE={items:[],running:[]};c.APP_MANUAL_REFRESH_UNTIL=0;c.appReadView=()=>view;c.appReadSchedulePaint=()=>{};c.appReadBegin=()=>()=>{};
 vm.runInContext(src.slice(src.indexOf('function appTrackedRead('),src.indexOf('// Indikátor zostáva aktívny')),c);
 const url=action=>'https://server/exec?action='+action;
 const response={ok:true,posts:[],events:[],rows:[],reps:[],plan:{},predaje:{}};
 const read=(action,run,priority='background')=>c.appTrackedRead(url(action),{},run||(()=>{calls++;return Promise.resolve(response);}),priority);
 for(const line of ['gp','gyn','reagila'])for(const role of ['admin','boss','bum','am west','am east','rep west','gyn-rep','kam']){
  user={username:'test',role,line};epoch++;c.APP_READ_REUSE={};c.APP_READ_META={};view={key:'home',type:'home',actions:['getCalEvents','getNastenka','getStockData','getPlnenieAll'],params:{rok:2026,Q:3}};
  await read('getCalEvents');await read('getNastenka');await read('getStockData');await read('getPlnenieAll&rok=2026&Q=3');
  const before=calls;
  for(const action of ['setUserPref','setGynMsSelection','setReagilaMsSelection']){c.appReadInvalidate('action='+action);await read('getStockData');await read('getCalEvents');}assert.equal(calls,before,'Saving preferences must not invalidate verified business data');
  c.appReadInvalidate('action=upsertCalEvent');await read('getStockData');assert.equal(calls,before,'A calendar change must not invalidate stocks');await read('getCalEvents');assert.equal(calls,before+1,'Calendar changes must load new events immediately');
  c.appReadInvalidate('action=nastenkaLike');await read('getCalEvents');assert.equal(calls,before+1,'A board reaction must not invalidate calendar');await read('getNastenka');assert.equal(calls,before+2);
  now+=61000;let finish;const pending=read('getCalEvents',()=>{const r=c.appReadResource(url('getCalEvents'));c.APP_REQUEST_QUEUE.running=[{resource:r,prio:'background'}];return new Promise(r=>finish=r);});
  assert.equal(c.appReadHomeSummary(view).groups.find(g=>g.id==='calendar').pending,false,'Background polling must not restart completed Home verification');
  view={key:'calendar',type:'calendar',actions:['getCalEvents'],params:{}};assert.equal(c.appReadSectionSummary(view).groups[0].pending,false,'Previously verified calendar stays settled during a background poll');
  c.APP_REQUEST_QUEUE.running[0].prio='critical';assert.equal(c.appReadSectionSummary(view).groups[0].pending,true,'Manual/foreground checks remain visible');
  c.APP_REQUEST_QUEUE.running[0].prio='background';delete c.APP_READ_META[c.appReadResource(url('getCalEvents')).key];assert.equal(c.appReadSectionSummary(view).groups[0].pending,true,'First verification must remain visible even when prefetched');
  c.APP_REQUEST_QUEUE.running=[];finish(response);await pending;
  c.APP_MANUAL_REFRESH_UNTIL=now+15000;const n=calls;await read('getStockData');assert.equal(calls,n+1,'Explicit refresh always contacts the server');c.APP_MANUAL_REFRESH_UNTIL=0;
  const nAvatar=calls;c.appReadInvalidate('action=setAvatar');await read('getStockData');assert.equal(calls,nAvatar+1,'Avatar/unknown mutations retain conservative invalidation');
  for(const mutation of ['setGynMsSelection','setReagilaMsSelection']){await read('getRepList');const n=calls;c.appReadInvalidate('action='+mutation);await read('getStockData');assert.equal(calls,n,'Competitor selection must preserve verified stocks');await read('getRepList');assert.equal(calls,n+1,'Competitor selection must invalidate a roster that could rehydrate old choices');}
  view=null;
 }
 function take(name){const a=src.indexOf('function '+name+'('),b=src.indexOf('\nfunction ',a+1);return src.slice(a,b);}
 vm.runInContext(take('appReadTimeout')+'\n'+take('appReadInflightKey'),c);
 const key=action=>c.appReadInflightKey(url(action),{},20000),oldCal=key('getCalEvents'),stock=key('getStockData');
 c.appReadInvalidate('action=upsertCalEvent');assert.notEqual(key('getCalEvents'),oldCal,'A post-write read cannot coalesce with a pre-write response');assert.equal(key('getStockData'),stock,'An unrelated source keeps its flight identity');
 c.appReadInvalidate('action=saveNastenka');let release;const old=read('getNastenka',()=>new Promise(r=>release=r));c.appReadInvalidate('action=nastenkaLike');release(response);await old;
 assert.equal(c.appReadReuse(c.appReadResource(url('getNastenka'))),null,'An old response cannot become a fresh post-mutation cache');
 await read('getNastenka');assert.ok(c.appReadReuse(c.appReadResource(url('getNastenka'))),'The next genuine read restores freshness');
 console.log(file+': 24 role/line lifecycles, scoped writes, quiet polls, first/manual refresh and stable unrelated data passed');
}})().catch(e=>{console.error(e);process.exitCode=1;});
