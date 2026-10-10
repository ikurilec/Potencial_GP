const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('app.js','utf8');
assert.ok(src.includes('function appQueuePriority('),'Queue must consider the currently visible view');
const part=src.slice(src.indexOf('var APP_REQUEST_QUEUE ='),src.indexOf('// getConfig je čisté čítanie'));
let view={actions:['getLekarne'],params:{login:'rep-a'}},calls=[],releases=[];
const c={setTimeout:()=>({}),clearTimeout:()=>{},Promise,URL,location:{href:'https://satori.test/'},appReadView:()=>view,
 appReadResource:u=>{const p=new URL(u).searchParams;return {action:p.get('action'),params:Object.fromEntries(p),owner:'test'};},
 appRequestMatchesView:(u,v)=>{if(!v)return false;const p=typeof u==='object'?u.params:Object.fromEntries(new URL(u).searchParams);return v.actions.includes(typeof u==='object'?u.action:p.action)&&(!v.params.login||p.login===v.params.login);},
 appFetchJsonRaw:u=>{calls.push(u);return new Promise(resolve=>releases.push(resolve));},appLineCapture:()=>({}),getSession:()=>({username:'test'})};
vm.createContext(c);vm.runInContext(part,c);
const url=(a,l)=>'https://server/exec?action='+a+'&login='+l;
c.appQueuedFetchJsonRaw(url('getPlnenieAll','background-a'),{},20000,'background');
c.appQueuedFetchJsonRaw(url('getPlnenieAll','background-b'),{},20000,'background');
assert.equal(calls.length,1,'Background reads leave one foreground slot free');
c.appQueuedFetchJsonRaw(url('getLekarne','rep-a'),{},20000,'background');
assert.equal(calls.length,2,'Visible data start immediately even when initially labelled background');
assert.match(calls[1],/getLekarne/);
const q=c.APP_REQUEST_QUEUE;q.active=2;q.items=[];
c.appQueuedFetchJsonRaw(url('getPlnenieAll','old-tab'),{},20000,'critical');
c.appQueuedFetchJsonRaw(url('getLekarne','rep-a'),{},20000,'critical');
c.appQueuedFetchJsonRaw(url('getLekarne','rep-b'),{},20000,'background');
view={actions:['getLekarne'],params:{login:'rep-b'}};q.active=1;c.appRequestQueueDrain();assert.match(calls.at(-1),/rep-b/,'Changing screens promotes already queued matching data');
q.active=2;q.items=[];view=null;
c.appQueuedFetchJsonRaw(url('getLekarne','first'),{},20000,'critical');c.appQueuedFetchJsonRaw(url('getLekarne','second'),{},20000,'critical');
assert.match(q.items[0].url,/first/,'Equal priority is FIFO');
console.log('Reserved foreground slot, dynamic view/representative promotion and FIFO passed');
(async()=>{
 let current={actions:['getLekarne'],params:{login:'rep-a'}},started=[],done=[];
 const d={...c,appReadView:()=>current,appFetchJsonRaw:u=>{started.push(u);return new Promise(resolve=>done.push(resolve));}};
 vm.createContext(d);vm.runInContext(part,d);
 d.appQueuedFetchJsonRaw(url('getLekarne','rep-a'),{},20000,'critical');
 d.appQueuedFetchJsonRaw(url('getPlnenieAll','preload-a'),{},20000,'background');
 d.appQueuedFetchJsonRaw(url('getPlnenieAll','preload-b'),{},20000,'background');
 assert.equal(started.length,2);
 current={actions:['getPlnenieAll'],params:{login:'visible'}};
 done[1]({ok:true});for(let i=0;i<8;i++)await Promise.resolve();
 assert.equal(started.length,2,'An old visible read now occupies the background slot; another preload must wait');
 d.appQueuedFetchJsonRaw(url('getPlnenieAll','visible'),{},20000,'background');
 assert.equal(started.length,3);assert.match(started[2],/visible/);
 console.log('Navigating away from an in-flight foreground read still reserves capacity for the new screen');
})().catch(e=>{console.error(e);process.exitCode=1;});
