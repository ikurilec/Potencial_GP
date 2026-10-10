const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');const s=fs.readFileSync('app.js','utf8'),a=s.indexOf('function okresyLoadAll('),b=s.indexOf('// ── Trvalá cache Okresov',a);
let timers=[],callbacks=[],paints=0,saved=0,done=0;
const c={Object,setTimeout:(fn,ms)=>{const t={fn,ms};timers.push(t);return t;},clearTimeout:()=>{},requestAnimationFrame:fn=>fn(),appLineCapture:()=>1,appLineContextActive:()=>true,appReadOwner:()=> 'owner',
 OKRESY_STATE:{reqId:1,oblast:'KE',kvartal:'2603',byCode:{}},okresyCodes:()=>['A','B'],okresyRender:()=>paints++,okresySaveCache:()=>saved++,appShowErrorCard:()=>{},okresyFetchCode:(a,b,q,id,cb)=>callbacks.push(cb)};
vm.createContext(c);vm.runInContext(s.slice(a,b),c);
c.okresyLoadAll(1,'v',{},true,true,()=>done++);const early=timers.find(t=>t.ms===20000);if(early)early.fn();
callbacks[0]({ok:true,okresy:[{}]},'2603');callbacks[1]({ok:true,okresy:[{}]},'2603');
assert.ok(paints>0,'Slow district results were discarded after the early timer');assert.equal(done,1);assert.equal(saved,1);console.log('Slow district responses still finish, paint and persist a complete result');

// A failed refresh keeps existing rows and never stamps incomplete data as fresh.
callbacks=[];c.OKRESY_STATE.byCode={A:{resp:{ok:true,old:true},kvartal:'2602'}};const before=saved;
c.okresyLoadAll(1,'new',{},false,true,()=>done++);callbacks[0](null,'2603',true);callbacks[1]({ok:true,okresy:[{}]},'2603',false);
assert.ok(c.OKRESY_STATE.byCode.A.resp.old);assert.equal(saved,before);
// Late data after the hard deadline cannot overwrite the fallback.
callbacks=[];c.okresyLoadAll(1,'new',{},false,true,()=>done++);timers.at(-1).fn();const snapshot=c.OKRESY_STATE.byCode;
callbacks[0]({late:true},'2603');assert.equal(c.OKRESY_STATE.byCode,snapshot);
console.log('District failure and deadline preserve cached rows without false freshness');
