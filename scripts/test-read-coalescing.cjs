const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8');
const part=source.slice(source.indexOf('// getConfig je čisté čítanie'),source.indexOf('// Jednotný retry mechanizmus'));
let user='rep',epoch=1,calls=[],pending=[];
const c={URL,Promise,JSON,Date,structuredClone,location:{href:'https://app/'},
 APP_DATA_READ_ACTIONS:['getConfig','getStockData','getPlnenieAll'],appReadOwner:()=>user,
 appLineCapture:()=>({epoch,line:'gp'}),APP_REQUEST_QUEUE:{items:[]},appQueueInsert:j=>c.APP_REQUEST_QUEUE.items.push(j),appRequestQueueDrain:()=>{},
 appQueuedFetchJsonRaw:(u,o,t,p,rec)=>{calls.push(u);if(rec)rec.job={prio:p};return new Promise((resolve,reject)=>pending.push({resolve,reject}));}};
vm.createContext(c);
vm.runInContext(source.slice(source.indexOf('var APP_DATA_READ_ACTIONS ='),source.indexOf('var APP_READ_META =')),c);
vm.runInContext(part,c);
const url='https://server/exec?action=getStockData&token=secret';
async function settle(){for(let i=0;i<10;i++)await Promise.resolve();}
(async()=>{
 for(const action of c.APP_DATA_READ_ACTIONS){
  const base='https://server/exec?action='+action+'&token=secret';let n=calls.length;
  const a=c.appQueuedFetchJsonUntracked(base+'&fresh=1&_check=123',{},20000,'background');
  const b=c.appQueuedFetchJsonUntracked(base+'&_check=456&fresh=1&fresh=1',{},20000,'critical');
  assert.equal(calls.length,n+1,'Equivalent simultaneous '+action+' must use one network request');
  pending.at(-1).resolve({ok:true,rows:[{count:7}]});const [x,y]=await Promise.all([a,b]);x.rows[0].count=0;assert.equal(y.rows[0].count,7,'Consumers must have independent JSON');
  await settle();c.appQueuedFetchJsonUntracked(base+'&fresh=1',{},20000);assert.equal(calls.length,n+2,'A subsequent explicit read must still reach the server');pending.at(-1).resolve({ok:true});await settle();
 }
 for(const variation of ['&fresh=1','&login=other','&token=another','&login=a&login=b']){
  let n=calls.length;const a=c.appQueuedFetchJsonUntracked(url,{},20000),b=c.appQueuedFetchJsonUntracked(url+variation,{},20000);
  assert.equal(calls.length,n+2,'Scope/auth/fresh parameters must remain distinct');pending.at(-2).resolve({});pending.at(-1).resolve({});await Promise.all([a,b]);
 }
 let n=calls.length;const a=c.appQueuedFetchJsonUntracked(url,{},20000);epoch++;const b=c.appQueuedFetchJsonUntracked(url,{},20000);user='other';const d=c.appQueuedFetchJsonUntracked(url,{},20000);
 assert.equal(calls.length,n+3,'Account and line epoch changes must not share reads');pending.slice(-3).forEach(p=>p.resolve({}));await Promise.all([a,b,d]);
 n=calls.length;const failed=c.appQueuedFetchJsonUntracked(url,{},20000).catch(()=>{});pending.at(-1).reject(Error('offline'));await failed;
 const retry=c.appQueuedFetchJsonUntracked(url,{},20000);assert.equal(calls.length,n+2,'Failed reads must leave no stuck inflight entry');pending.at(-1).resolve({});await retry;
 n=calls.length;c.appQueuedFetchJsonUntracked(url.replace('getStockData','setStock'),{},20000);c.appQueuedFetchJsonUntracked(url.replace('getStockData','setStock'),{},20000);assert.equal(calls.length,n+2,'Writes never coalesce');pending.slice(-2).forEach(p=>p.resolve({}));
 console.log('Shared reads, fresh/scope/auth separation, clone isolation, failed retry, writes and account/epoch guards passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
