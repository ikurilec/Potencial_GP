const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');const s=fs.readFileSync('app.js','utf8'),a=s.indexOf('function okresyFetchCode('),b=s.indexOf('\nfunction ',a+10);
let calls=[],result=null,response={ok:true,summary:[],okresy:[],okresy_prev:[{nas_m1:12}]};const c={Array,Object,Promise,IS_DEV:false,OKRESY_STATE:{reqId:1},PHARMA_STATE:{cache:{}},appLineCapture:()=>1,appLineContextActive:()=>true,appReadOwner:()=> 'owner',
 pharmaKvartalPrev:()=> '2602',pharmaDataRequestUrl:(code,o,q,prev,graf)=>{assert.ok(prev&&graf,'District reads miss the warmed combined server cache');return q;},
 _phPersistSave:()=>{},scriptUrl:x=>x,appFetchWithRetry:(url,opts)=>{assert.equal(opts.timeoutMs,30000);assert.equal(opts.retries,1);calls.push(url);return Promise.resolve(response);}};
vm.createContext(c);vm.runInContext(s.slice(a,b),c);
(async()=>{
 c.okresyFetchCode('A','KE','2603',1,(r,q)=>result={r,q},false,true);for(let i=0;i<12;i++)await Promise.resolve();assert.equal(calls.length,1,'Combined previous-quarter data should not trigger a second cold request');assert.equal(result.q,'2602');assert.equal(result.r.okresy[0].nas_m1,12);
 calls=[];response={ok:true,okresy:[],okresy_prev:[]};c.okresyFetchCode('B','KE','2603',1,(r,q)=>result={r,q},false,true);for(let i=0;i<12;i++)await Promise.resolve();assert.equal(calls.length,1,'Known-empty previous quarter must not cause another sheet scan');assert.equal(result.r,null);
 response={ok:true,okresy:[{nas_m1:0,tot_pat_m1:100}],okresy_prev:[]};c.okresyFetchCode('C','KE','2603',1,(r,q)=>result={r,q},false,true);for(let i=0;i<12;i++)await Promise.resolve();assert.equal(result.r.okresy[0].tot_pat_m1,100,'Zero own market share must not hide an existing market');
 console.log('Combined quarter cache, known-empty response and zero-own-share districts passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
