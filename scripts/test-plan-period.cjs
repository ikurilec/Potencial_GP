const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const files=['app.js','nahlad/app.js'];
function harness(file, date='2026-10-08'){
 const src=fs.readFileSync(file,'utf8'),storage={},cache={},requests=[];
 let line='gp',user='rep',epoch=1,responses={};
 const RealDate=Date;class Clock extends RealDate{constructor(...args){super(...(args.length?args:[date+'T12:00:00']));}static now(){return new Clock().getTime()}}
 const ctx={Date:Clock,Promise,JSON,Number,Math,Object,Error,isFinite,DataStore:{get:()=>({data:null})},PL_STATE:{year:2026,qCache:{}},REP_PL_STATE:{year:2026,qCache:{}},plnenieBuildAggregates:()=>({}),
 dsRead:k=>storage[k],dsWrite:(k,v)=>storage[k]=v,localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v},
 getSession:()=>({line,username:user}),appLineCapture:()=>({line,epoch}),appLineContextActive:c=>c.line===line&&c.epoch===epoch,
 _plLsKey:(y,q)=>line+'|'+y+'|'+q,_plRepLsKey:(u,y,q)=>line+'|'+u+'|'+y+'|'+q,_plLsLoad:k=>cache[k],
 gynPlnenieCacheKey:(y,q)=>line+'|'+user+'|'+y+'|'+q,gynCacheRead:k=>cache[k],gynCacheWrite:(k,d)=>cache[k]=d,gynPreprocessData:()=>{},GYN_LB:{plCache:{}},
 scriptUrl:p=>p,gynScriptUrl:p=>p,appFetchWithRetry:url=>{requests.push(url);let p=new URLSearchParams(url);let k=p.get('rok')+':'+p.get('Q');let d=responses[k];return d instanceof Error?Promise.reject(d):typeof d==='function'?d():Promise.resolve(d||{ok:true,plan:{},predaje:{}})}};
 vm.createContext(ctx);
 const start=src.indexOf('var PLNENIE_PLAN_PERIODS');assert.ok(start>=0,'Missing plan-based period resolver');
 vm.runInContext(src.slice(start,src.indexOf('function plnenieDefaultQ()',start)),ctx);
 vm.runInContext(src.slice(src.indexOf('function plnenieCurrentQ()'),src.indexOf('}',src.indexOf('function plnenieCurrentQ()'))+1),ctx);
 return {ctx,storage,cache,requests,setResponses:r=>responses=r,switchLine:l=>{line=l;epoch++},switchUser:u=>{user=u;epoch++},src};
}
const planned={ok:true,plan:{rep:{product:100}},predaje:{}};
(async()=>{for(const file of files){
 const h=harness(file);h.cache['gp|rep|2026|3']={data:planned};
 assert.equal(h.ctx.plnenieDefaultPeriod().q,3,'Cached Q3 plans select Q3 immediately');
 h.setResponses({'2026:4':{ok:true,plan:{},predaje:{rep:{total:900}}},'2026:3':planned});
 assert.equal((await h.ctx.plneniePlansCheck()).q,3,'New Q4 sales cannot select Q4 without plans');
 assert.equal(h.ctx.plnenieCurrentQ(),4,'Calendar helper stays unchanged');
 h.setResponses({'2026:4':planned});assert.equal((await h.ctx.plneniePlansCheck()).q,4,'New Q4 plans activate Q4');
 h.setResponses({'2026:4':new Error('offline')});assert.equal((await h.ctx.plneniePlansCheck()).q,4,'Network error preserves known period');
 h.switchLine('gyn');assert.equal(h.ctx.plnenieDefaultPeriod().q,4,'Another line must not reuse GP availability');
 h.setResponses({'2026:4':{ok:true,plan:{rep:{product:0}}},'2026:3':planned});assert.equal((await h.ctx.plneniePlansCheck()).q,3);
 assert.ok(h.requests.at(-1).includes('fullLine=1'),'Gyn availability uses whole line');
 h.switchLine('reagila');h.setResponses({'2026:4':{ok:true,predaje:{rep:{total:1}}}});await h.ctx.plneniePlansCheck();
 assert.equal(h.ctx.plnenieDefaultPeriod().q,4,'Malformed response must not mark the Q as empty');
 h.switchLine('gp');assert.equal(h.ctx.plnenieDefaultPeriod().q,4);
 h.switchUser('other');h.setResponses({'2026:4':{ok:true,plan:{}},'2026:3':planned});assert.equal((await h.ctx.plneniePlansCheck()).q,3);
 let resolve;h.setResponses({'2026:4':()=>new Promise(r=>resolve=r)});let p=h.ctx.plneniePlansCheck();await Promise.resolve();h.switchLine('gyn');resolve(planned);await p;
 assert.equal(h.ctx.plnenieDefaultPeriod().q,4,'Late other-line response must not change current scope');
 const july=harness(file,'2026-07-08');july.cache['gp|rep|2026|4']={data:planned};july.cache['gp|rep|2026|3']={data:planned};
 assert.equal(july.ctx.plnenieDefaultPeriod().q,3,'Preloaded future Q4 plans cannot select a future calendar Q');
 july.setResponses({'2026:3':planned});await july.ctx.plneniePlansCheck();assert.ok(july.requests.every(url=>!url.includes('Q=4')));
 const jan=harness(file,'2027-01-05');jan.setResponses({'2027:1':{ok:true,plan:{}},'2026:4':planned});const dp=await jan.ctx.plneniePlansCheck();assert.equal(dp.q,4);assert.equal(dp.year,2026);
 console.log(file+': plan period availability scenarios passed');
}})().catch(e=>{console.error(e);process.exit(1)});
