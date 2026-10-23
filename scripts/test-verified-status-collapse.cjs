'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
for(const file of ['app.js','nahlad/app.js']){
 const src=fs.readFileSync(file,'utf8');let line='gp',role='admin',epoch=0;const now=Date.now();
 const c={Date,URL,URLSearchParams,Object,Array,JSON,Math,Number,Promise,location:{href:'https://app/'},getSession:()=>({username:'test',role,line}),appLineTag:()=>line,appLineCapture:()=>({line,epoch}),appLineContextActive:x=>x.line===line&&x.epoch===epoch,localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>1,clearTimeout(){},document:{}};
 vm.createContext(c);vm.runInContext(src.slice(src.indexOf('var APP_DATA_READ_ACTIONS'),src.indexOf('// ── Overovanie dát otvorenej sekcie')),c);
 const a=src.indexOf('function appReadCollapseEligible('),b=src.indexOf('\nfunction ',a+1);vm.runInContext(src.slice(a,b),c);c.APP_READ_CHECKS={};c.APP_REQUEST_QUEUE={items:[],running:[]};
 for(line of ['gp','gyn','reagila'])for(role of ['admin','boss','bum','am west','am east','rep west','gyn-rep','kam']){
  epoch++;c.APP_READ_META={};const view={type:'sales',key:'sales',actions:['getPlnenieAll','getConfig'],params:{rok:2026,Q:3},path:'https://server/exec'};c.appReadView=()=>view;
  function put(action,time){const r=c.appReadResource('https://server/exec?action='+action);r.reuseVersion=c.appReadVersion(r.action);r.visible=true;c.appReadRemember(r,time,false);return r;}
  const sales=put('getPlnenieAll&rok=2026&Q=3',now),meta=put('getConfig&key=notif_predaje',now-86400000);c.APP_READ_META[meta.key].instance='previous-run';
  let summary=c.appReadSummary(view);assert.equal(summary.groups.length,1,'Internal notification/config history is not a displayed data section');assert.equal(c.appReadCollapseEligible(summary,'verified'),true,'A current successful sales check must collapse despite old config bookkeeping');
  c.APP_REQUEST_QUEUE.running=[{resource:meta,prio:'background'}];summary=c.appReadSummary(view);assert.equal(summary.pending,false,'Config polling cannot reopen a completed sales panel');assert.equal(c.appReadCollapseEligible(summary,'verified'),true);
  c.APP_REQUEST_QUEUE.running=[{resource:sales,prio:'critical'}];summary=c.appReadSummary(view);assert.equal(summary.pending,true);assert.equal(c.appReadCollapseEligible(summary,'pending'),false,'Actual sales loading must remain visible');
  c.APP_REQUEST_QUEUE.running=[];c.appReadRemember(sales,now+1,true);assert.equal(c.appReadCollapseEligible(c.appReadSummary(view),'error'),false,'Actual data failure must keep retry visible');
 }
 console.log(file+': 24 role/line sales completion, config polling, pending and failure cases passed');
}
