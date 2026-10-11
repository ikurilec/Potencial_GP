const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function take(s,name){const a=s.indexOf('function '+name+'('),b=s.indexOf('\nfunction ',a+1);assert.ok(a>=0);return s.slice(a,b);}
(async()=>{
 for(const file of ['app.js','nahlad/app.js']){
  const s=fs.readFileSync(file,'utf8'),c={Promise,Error,URL,Date,Object,Array,Math,JSON,Number,location:{href:'https://app/'},
   getSession:()=>({username:'test',role:'admin',line:'gp'}),appLineTag:()=> 'gp',appLineCapture:()=>({line:'gp',epoch:1}),appLineContextActive:()=>true,
   setTimeout:fn=>{fn();return 1;},clearTimeout(){},document:{},localStorage:{getItem:()=>null,setItem(){}}};
  vm.createContext(c);vm.runInContext(s.slice(s.indexOf('var APP_DATA_READ_ACTIONS'),s.indexOf('// ── Overovanie dát otvorenej sekcie')),c);
  vm.runInContext(take(s,'appFetchWithRetryRaw'),c);
  for(const [action,data] of [['getPharmaData',{ok:true,summary:[],okresy:[]}],['getStockData',{ok:true,rows:[]}],['getPlnenieAll',{ok:true,plan:{},predaje:{}}]]){
   let calls=0;const out=await c.appFetchWithRetryRaw('https://server/exec?action='+action,{retries:1,delayFn:()=>0,fetcher:()=>Promise.resolve(++calls===1?{ok:false,error:'Transient backend failure'}:data)});
   assert.equal(calls,2,action+': retry a failed API reply, not just a rejected transport');assert.equal(out,data);
   calls=0;await assert.rejects(c.appFetchWithRetryRaw('https://server/exec?action='+action,{retries:1,delayFn:()=>0,fetcher:()=>{calls++;return Promise.resolve({ok:false,error:'Persistent failure'});}}));
   assert.equal(calls,2,'Persistent failure is bounded');
   calls=0;await c.appFetchWithRetryRaw('https://server/exec?action='+action,{retries:1,fetcher:()=>{calls++;return Promise.resolve(data);}});assert.equal(calls,1,'Valid empty data are a success');
  }
  let calls=0;await c.appFetchWithRetryRaw('https://server/exec?action=saveNastenka',{fetcher:()=>{calls++;return Promise.resolve({ok:false,error:'Write failed'});}});assert.equal(calls,1,'Read validation must not repeat writes');
  calls=0;await assert.rejects(c.appFetchWithRetryRaw('https://server/exec?action=getStockData',{fetcher:()=>{calls++;return Promise.resolve({ok:false,error:'Session expired'});}}),/Session expired/);assert.equal(calls,1,'An expired login cannot be recovered by repeating the same request');
  calls=0;await c.appFetchWithRetryRaw('https://server/exec?action=getPharmaData',{retries:1,delayFn:()=>0,fetcher:()=>Promise.resolve(++calls===1?{ok:true,summary:[]}:{ok:true,summary:[],okresy:[]})});assert.equal(calls,2,'Incomplete market data cannot be marked green');
  let loaded=[];c.PHARMA_STATE={codes:['AFLtbl','AFLsach'],activeCode:'AFLtbl',oblast:'KE',kvartal:'2602',requestedKvartal:'2603',cache:{}};
  c.document={getElementById:()=>null};c.loadPharmaData=(code,oblast,kvartal)=>loaded.push({code,oblast,kvartal});c.skelPharma=()=>'';c._animPlQ=()=>{};
  vm.runInContext(take(s,'pharmaSetDisplayKvartal')+take(s,'pharmaSwitchTab'),c);c.pharmaSwitchTab('AFLsach');
  assert.equal(loaded[0].kvartal,'2603','Sachets start in the requested quarter, independent of the tablets fallback');
  vm.runInContext(take(s,'pharmaAvailableKvartal'),c);
  assert.equal(c.pharmaAvailableKvartal({summary:[],okresy_prev:[{nas_m1:null,nas_m2:null,nas_m3:null}],kvartal_prev:'2602'},'2603'),null,'Empty historical placeholders cannot cause unbounded period fallback');
  assert.equal(c.pharmaAvailableKvartal({summary:[{mesiac:'2605',terit_ms:0,sk_ms:0},{mesiac:'2610',terit_ms:5,sk_ms:6}]},'2603'),'2602','Pick an existing period, including a zero share, without loading a future quarter');
  console.log(file+': read API retries, bounded failure, empty success, write exclusion and Aflamil form period isolation passed');
 }
})().catch(e=>{console.error(e);process.exit(1);});
