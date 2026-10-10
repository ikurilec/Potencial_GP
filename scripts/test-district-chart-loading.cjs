const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const s=fs.readFileSync('app.js','utf8'),a=s.indexOf('function loadPharmaOkresGrafData('),b=s.indexOf('function openPharmaOkresChart(',a);
let epoch=1,pending=[];const c={Promise,IS_DEV:false,PHARMA_OKRES_STATE:{cache:{},loading:{}},appReadOwner:()=> 'gp|manager',appLineCapture:()=>({epoch}),appLineContextActive:x=>x.epoch===epoch,
 pharmaOkresGrafRequestUrl:()=> 'url',appQueuedFetchJson:()=>new Promise(r=>pending.push(r))};vm.createContext(c);vm.runInContext(s.slice(a,b),c);
async function flush(){for(let i=0;i<8;i++)await Promise.resolve();}
(async()=>{
 let values=[];c.loadPharmaOkresGrafData('A','KE','Košice',d=>values.push(d));c.loadPharmaOkresGrafData('A','KE','Košice',d=>values.push(d));
 assert.equal(pending.length,1);pending[0]({ok:true,rows:[{},{}]});await flush();assert.equal(values.length,2,'Reopening a loading district chart loses its completion callback');
 c.PHARMA_OKRES_STATE.cache={};values=[];c.loadPharmaOkresGrafData('B','KE','Košice',d=>values.push(d));epoch++;c.loadPharmaOkresGrafData('B','KE','Košice',d=>values.push(d));
 assert.equal(pending.length,3);pending[1]({ok:true,rows:[{old:true},{}]});await flush();assert.equal(values.length,0,'Old epoch chart must not paint');pending[2]({ok:true,rows:[{fresh:true},{}]});await flush();assert.equal(values.length,1);assert.ok(values[0].rows[0].fresh);
 console.log('District chart shared completion, reopening and stale-epoch isolation passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
