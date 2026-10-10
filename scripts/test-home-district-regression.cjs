const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const s=fs.readFileSync('app.js','utf8');
function fn(name){const a=s.indexOf('function '+name+'('),b=s.indexOf('\nfunction ',a+10);return s.slice(a,b);}
let started=0,now=1000;
const c={URL,Date:{now:()=>now},Promise,Object,location:{href:'https://app/'},APP_READ_GENERATIONS:{},appReadView:()=>({type:'home'}),appReadResource:()=>({key:'sales',action:'getPlnenieAll'}),appReadLast:()=>900,appRequestMatchesView:()=>true,appReadBegin:()=>{started++;return ()=>{};},appReadRemember:()=>{},appReadValid:()=>true};
vm.createContext(c);vm.runInContext(fn('appTrackedRead'),c);
const ranking={LB_STATE:{mode:'plnenie',loading:false,data:null},lbEnsureLineState:()=>{},lbUpdateNavBtn:()=>{},document:{body:{classList:{contains:()=>false}},getElementById:()=>null},_lbHsLoad:()=>{throw Error('Obsolete visit ranking preload reached the network/cache path');}};
vm.createContext(ranking);vm.runInContext(fn('lbLoadData'),ranking);
assert.doesNotThrow(()=>ranking.lbLoadData(),'Fulfilment ranking must not preload every representative visit history');
(async()=>{
 await c.appTrackedRead('https://server/?action=getPlnenieAll',{},()=>Promise.resolve({ok:true}),'background');
 assert.equal(started,0,'Deferred Home preloads must not restart the visible verification cycle');
 await c.appTrackedRead('https://server/?action=getPlnenieAll',{},()=>Promise.resolve({ok:true}),'critical');assert.equal(started,1,'Explicit Home refresh still shows progress');
 let callbacks=[],renders=0;
 const d={Object,Math,setTimeout:()=>1,clearTimeout:()=>{},requestAnimationFrame:f=>f(),appLineCapture:()=>1,appLineContextActive:()=>true,appReadOwner:()=> 'owner',OKRESY_STATE:{reqId:1,oblast:'KE',kvartal:'2604',byCode:{}},okresyCodes:()=>Array.from({length:10},(_,i)=>String(i)),okresyRender:()=>renders++,okresySaveCache:()=>{},appShowErrorCard:()=>{},okresyFetchCode:(code,o,q,id,cb)=>callbacks.push(cb)};
 vm.createContext(d);vm.runInContext(s.slice(s.indexOf('function okresyLoadAll('),s.indexOf('// ── Trvalá cache Okresov',s.indexOf('function okresyLoadAll('))),d);
 d.okresyLoadAll(1,'v',{},true,true);
 assert.equal(callbacks.length,2,'Only two district reads may enter the shared queue at once');
 for(let i=0;i<10;i++){callbacks[i]({ok:true,okresy:[{}]},'2604',false);assert.ok(callbacks.length<=Math.min(10,i+3));}
 assert.equal(Object.keys(d.OKRESY_STATE.byCode).length,10);assert.ok(renders>0);
 console.log('Home background verification and bounded district batch regression passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
