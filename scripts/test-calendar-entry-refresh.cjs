'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const tick=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
(async()=>{for(const file of ['app.js','nahlad/app.js']){
 const src=fs.readFileSync(file,'utf8'),a=src.indexOf('function gynCalSync('),b=src.indexOf('// Manuálny sync',a);let line='gp';const pending=[],calls=[];
 const c={Date,Promise,JSON,Array,GYN_CAL:{events:[{id:'cached'}],_everSyncedOk:true},gynCalRemoteOn:()=>true,gynCalLine:()=>line,appLineCapture:()=>({line}),appLineContextActive:x=>x.line===line,gynCalScriptUrl:q=>'https://server.test/?'+q,APP_FETCH_TIMEOUT_PRELOAD_MS:12000,
  appQueuedFetchJson:(url,opts,timeout,priority)=>{calls.push({u:new URL(url),priority});return new Promise(r=>pending.push(r));},gynCalNormEvent:x=>x,gynCalSig:x=>JSON.stringify(x),gynCalPersist(){},gynCalHost:()=>null,gynCalUpdateBadge(){}};
 vm.createContext(c);vm.runInContext(src.slice(a,b),c);
 c.gynCalSync();c.gynCalSync('critical',true);
 assert.equal(calls.length,2,'A foreground opening must attach a fresh read even during an older sync');assert.equal(calls[1].u.searchParams.get('fresh'),'1');assert.equal(calls[1].priority,'critical');
 pending[1]({ok:true,events:[{id:'latest'}]});await tick();pending[0]({ok:true,events:[{id:'older'}]});await tick();assert.equal(c.GYN_CAL.events[0].id,'latest','Late automatic response must not undo the fresh entry result');
 c.gynCalSync('critical',true);assert.equal(calls.length,3,'A second opening always checks again');assert.equal(calls[2].u.searchParams.get('fresh'),'1');line='gyn';pending[2]({ok:true,events:[{id:'wrong-source'}]});await tick();assert.equal(c.GYN_CAL.events[0].id,'latest');
 console.log(file+': forced calendar entry, overlapping sync order and line isolation passed');
}})().catch(e=>{console.error(e);process.exitCode=1;});
