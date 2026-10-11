const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const dirs=[process.env.SATORI_APPS_SCRIPT_DIR,path.resolve(__dirname,'../apps_script'),path.resolve(__dirname,'../../../apps_script')].filter(Boolean);
for(const line of ['GOLEM','GYN','REAGILA']){
 const file=dirs.map(d=>path.join(d,'KOD_'+line+'.txt')).find(f=>fs.existsSync(f));assert.ok(file,'Local backend source missing: '+line);
 const s=fs.readFileSync(file,'utf8');
 function take(name){const a=s.indexOf('function '+name+'('),b=s.indexOf('\nfunction ',a+1);assert.ok(a>=0);return s.slice(a,b<0?undefined:b).split('\n//')[0];}
 let got=false,mode='busy',wait=0,released=0,accessed=0,written=[],memory={},uuid=0;
 const cache={get:k=>memory[k]??null,getAll:keys=>Object.fromEntries(keys.filter(k=>k in memory).map(k=>[k,memory[k]])),put:(k,v)=>memory[k]=v,putAll:o=>Object.assign(memory,o),removeAll:keys=>keys.forEach(k=>delete memory[k])};
 const c={Date,JSON,Math,Number,FORCE_FRESH_READ_:false,CACHE_TTL_SEC:30,DATA_CACHE_TTL_SEC:7200,CACHE_CHUNK_CHARS:30000,CACHE_CHUNK_MARK:'\u0001CHUNKS:',SC_CHUNK_CHARS:4,SC_DEFAULT_TTL_MS:1000,
  CacheService:{getScriptCache:()=>cache},Utilities:{getUuid:()=> 'generation-'+(++uuid)},Logger:{log:()=>{}},
  LockService:{getScriptLock:()=>({tryLock:ms=>{wait=ms;if(mode==='throw')throw Error('lock unavailable');return got=mode==='ok';},releaseLock:()=>released++})},
  scSheet_:()=>{accessed++;assert.equal(got,true,'Never write durable cache without holding the lock');return {getLastRow:()=>1,getMaxRows:()=>100,getRange:()=>({setValues:rows=>written.push(rows)})};},scDeleteRows_:()=>{}};
 assert.match(s,/^var DATA_CACHE_TTL_SEC = 7200;/m,'Backend TTL definition must remain present');
 const constants=s.split('\n').filter(l=>/^var (CACHE_TTL_SEC|DATA_CACHE_TTL_SEC|CACHE_CHUNK_CHARS|CACHE_CHUNK_MARK|FORCE_FRESH_READ_)\s*=/.test(l)).join('\n');
 vm.createContext(c);vm.runInContext(constants+take('scPut_')+take('cacheGetText_')+take('cachePutText_')+take('bigPutText_'),c);
 c.bigPutText_({},'busy','prepared response',1000);
 assert.ok(wait<=250,'An optional cache write must not delay a prepared response by 20 seconds');
 assert.equal(accessed,0,'Busy durable cache is skipped');assert.equal(c.cacheGetText_('busy'),'prepared response','Fast cache is still populated');assert.equal(released,0);
 mode='throw';c.scPut_({},'broken','abc',1000);assert.equal(accessed,0,'Lock exceptions must not cause unlocked writes');
 mode='ok';c.scPut_({},'safe','abcdefghij',1000);assert.equal(written[0].length,3);assert.equal(written[0].map(r=>r[4].slice(1)).join(''),'abcdefghij');assert.equal(released,1);
 const payload=JSON.stringify({text:'X'+'Á🙂'.repeat(35000)});
 c.cachePutText_('large',payload,7200);assert.equal(c.cacheGetText_('large'),payload,'Large responses must use the fast cache instead of rereading Sheets');
 for(const [key,value] of Object.entries(memory))if(key.startsWith('satori-cache-v2:large#')){
  assert.ok(value.length<=30000);
  assert.ok(!(value.charCodeAt(value.length-1)>=0xD800&&value.charCodeAt(value.length-1)<=0xDBFF),'A cache chunk must not end with a split emoji');
  assert.ok(!(value.charCodeAt(0)>=0xDC00&&value.charCodeAt(0)<=0xDFFF),'A cache chunk must not start with a split emoji');
 }
 const old={...memory};c.cachePutText_('large',payload.replaceAll('Á','B'),7200);const head=memory['satori-cache-v2:large'];
 for(const [key,value] of Object.entries(old))if(key!=='satori-cache-v2:large')memory[key]=value;
 assert.equal(c.cacheGetText_('large'),payload.replaceAll('Á','B'),'Old chunk writes cannot mix with the new generation');
 const manifest=JSON.parse(head.slice(c.CACHE_CHUNK_MARK.length));assert.equal(manifest.v,2);delete memory['satori-cache-v2:large#'+manifest.gen+'#0'];
 assert.equal(c.cacheGetText_('large'),null,'An incomplete cached response must be a miss, not corrupted data');
 if(line==='GOLEM'){
  vm.runInContext(take('cacheBust_'),c);memory.busy='legacy response';c.cacheBust_('busy');
  assert.equal(c.cacheGetText_('busy'),null,'Write invalidation removes the new cache namespace');
  assert.equal(memory.busy,undefined,'Write invalidation also removes the legacy key');
 }
 c.FORCE_FRESH_READ_=true;assert.equal(c.cacheGetText_('busy'),null,'Manual refresh still bypasses all caches');
 console.log(line+': bounded cache locking, safe contention, complete large responses and generation isolation passed');
}
