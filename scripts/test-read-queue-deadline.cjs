const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const src=fs.readFileSync('app.js','utf8'),part=src.slice(src.indexOf('var APP_REQUEST_QUEUE ='),src.indexOf('// getConfig je čisté čítanie'));
let timers=[],started=[],pending=[];
const c={Promise,Date,setTimeout:(fn,ms)=>{const t={fn,ms};timers.push(t);return t;},clearTimeout:t=>timers=timers.filter(x=>x!==t),
appReadView:()=>null,appReadResource:u=>u==='write'?null:{action:u,ctx:1},appLineContextActive:()=>true,appRequestMatchesView:()=>false,
appFetchJsonRaw:u=>{started.push(u);if(u==='throws')throw new Error('sync failure');return new Promise(r=>pending.push(r));}};
vm.createContext(c);vm.runInContext(part,c);
async function flush(){for(let i=0;i<10;i++)await Promise.resolve();}
(async()=>{
 c.APP_REQUEST_QUEUE.active=2;let error=null;
 const read=c.appQueuedFetchJsonRaw('queued',{},16000,'critical').catch(e=>error=e);await flush();
 const t=timers.find(t=>t.ms>=30000&&t.ms<=60000);assert.ok(t,'Queued reads have no deadline');t.fn();await read;
 assert.ok(error);assert.equal(c.APP_REQUEST_QUEUE.items.length,0);assert.equal(started.length,0);
 c.APP_REQUEST_QUEUE.active=0;
 await c.appQueuedFetchJsonRaw('throws',{},16000,'critical').catch(()=>{});await flush();assert.equal(c.APP_REQUEST_QUEUE.active,0,'Synchronous error leaks a network slot');
 c.appQueuedFetchJsonRaw('next',{},16000,'critical');await flush();assert.equal(started.at(-1),'next');pending.at(-1)({ok:true});await flush();assert.equal(c.APP_REQUEST_QUEUE.active,0);
 c.APP_REQUEST_QUEUE.active=2;c.appQueuedFetchJsonRaw('write',{},16000,'critical');assert.equal(timers.length,0,'Queue deadlines must not expire writes');
 console.log('Queued read timeout, removal, slot recovery and write isolation passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
