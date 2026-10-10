const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8');
function fn(name){const start=source.indexOf('function '+name+'(');assert.ok(start>=0,'Missing '+name);const end=source.indexOf('\nfunction ',start+1);return source.slice(start,end);}
(async()=>{
 let queueTimer,readTimeout;
 const queue={items:[],active:2,max:2};
 const c={APP_REQUEST_QUEUE:queue,appTrackedRead:(url,opts,run)=>run(url,opts),setTimeout:(cb,ms)=>{assert.equal(ms,15000);queueTimer=cb;return 1;},clearTimeout:()=>{},appRequestQueueDrain:()=>{},
  appQueueInsert:job=>queue.items.unshift(job),appQueuedFetchJsonRaw:(url,opts,timeout,priority,rec)=>{readTimeout=timeout;return new Promise((resolve,reject)=>{rec.job={url,prio:priority,resolve,reject};queue.items.push(rec.job);});}};
 vm.createContext(c);vm.runInContext(fn('lkQueueRead')+fn('lkPromoteQueuedRead'),c);
 const rec={};const pending=c.lkQueueRead('read', 'background', rec);
 assert.equal(readTimeout,45000,'Cold pharmacy sheet gets 45-second network deadline');
 queue.items.unshift({url:'other',prio:'background'});
 c.lkPromoteQueuedRead(rec);
 assert.equal(queue.items[0],rec.job);assert.equal(rec.job.prio,'critical');
 queueTimer();await assert.rejects(pending,/queue timeout/);
 assert.ok(!queue.items.includes(rec.job),'Expired queued pharmacy read must not run later');
 assert.equal(queue.items.length,1,'Other reads must remain intact');
 const cache={rep:{ts:20,rows:[{mesiac:9}]}};
 c.LK_STATE={cache};c.LB_ALL_REPS=[];c.lkCacheKey=x=>x;c.lkSetCache=(key,rows)=>cache[key]={rows};
 vm.runInContext(fn('lkPrimeCacheFromRows'),c);
 c.lkPrimeCacheFromRows([{login:'rep',mesiac:8}],true,10);
 assert.equal(cache.rep.rows[0].mesiac,9,'Late bulk read must not replace newer per-representative data');
 console.log('Pharmacy read promotion, queue deadline and separate network timeout passed');
})().catch(e=>{console.error(e);process.exitCode=1});
