const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
(async()=>{
 for(const file of ['app.js','nahlad/app.js']){
  const s=fs.readFileSync(file,'utf8');let view,calls=[];
  const c={URL,Date,Promise,Object,Array,Math,JSON,Number,structuredClone,location:{href:'https://app/'},
   getSession:()=>({username:'admin',role:'admin',line:'gp'}),appLineTag:()=> 'gp',appLineCapture:()=>({line:'gp',epoch:1}),appLineContextActive:()=>true,
   localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>1,clearTimeout(){},document:{},APP_FETCH_TIMEOUT_MS:12000,APP_MANUAL_REFRESH_UNTIL:0,
   appReadView:()=>view,APP_REQUEST_QUEUE:{items:[],running:[]},appQueuedFetchJsonRaw:url=>{calls.push(new URL(url));return Promise.resolve({ok:true});}};
  vm.createContext(c);vm.runInContext(s.slice(s.indexOf('var APP_DATA_READ_ACTIONS'),s.indexOf('// ── Overovanie dát otvorenej sekcie')),c);
  vm.runInContext(s.slice(s.indexOf('// getConfig je čisté čítanie'),s.indexOf('// Jednotný retry mechanizmus')),c);
  const base='https://server/exec?action=';
  view={actions:['getPharmaData'],path:'https://server/exec',params:{produkt:'AFLsach',oblast:'KE',kvartal:'2603'}};
  const query='getPharmaData&produkt=AFLsach&oblast=KE&kvartal=2603&token=opaque%2Btoken';
  await c.appQueuedFetchJsonUntracked(base+query);assert.equal(calls.at(-1).searchParams.has('fresh'),false,'Automatic reads retain server cache');
  const cached=c.appReadResource(base+query);c.APP_READ_REUSE[cached.key]={json:'{}',ts:Date.now(),ctx:c.appLineCapture(),version:c.APP_READ_REUSE_VERSION};
  assert.ok(c.appReadReuse(cached),'Successful recent automatic reads can still reuse data');
  assert.equal(c.appReadReuse(c.appReadResource(base+query+'&fresh=1')),null,'An explicit fresh read cannot reuse memory after the manual window expires');
  c.APP_MANUAL_REFRESH_UNTIL=Date.now()+15000;
  await c.appQueuedFetchJsonUntracked(base+query);assert.equal(calls.at(-1).searchParams.get('fresh'),'1','Manual reads bypass server cache even inside custom fetchers');
  assert.equal(calls.at(-1).searchParams.get('token'),'opaque+token','Authorization must remain intact');
  await c.appQueuedFetchJsonUntracked(base+query+'&fresh=1');assert.equal(calls.at(-1).searchParams.getAll('fresh').length,1);
  for(const query of ['saveNastenka','getPharmaData&produkt=AFLsach&oblast=PO&kvartal=2603','getPharmaData&produkt=AFLtbl&oblast=KE&kvartal=2603','getPharmaData&produkt=AFLsach&oblast=KE&kvartal=2601']){
   await c.appQueuedFetchJsonUntracked(base+query);assert.equal(calls.at(-1).searchParams.has('fresh'),false,'Writes and unrelated preloads must retain their behavior');
  }
  for(const action of c.APP_DATA_READ_ACTIONS){
   view={actions:[action],path:'https://server/exec',params:{}};
   await c.appQueuedFetchJsonUntracked(base+action);assert.equal(calls.at(-1).searchParams.get('fresh'),'1',action+': explicit refresh reaches the server');
  }
  // Bundled graph replies must replace both graph storage and a prior reusable
  // standalone graph reply; a later warm read must not resurrect old values.
  c.APP_MANUAL_REFRESH_UNTIL=0;view={actions:['getPharmaData','getPharmaGraf'],path:'https://server/exec',params:{}};
  c.PHARMA_GRAF_STATE={loading:{},cache:{}};c.DataStore={set(){}};c.pharmaGrafFlushWaiters=()=>{};
  c.pharmaGrafRequestUrl=(code,region)=>base+'getPharmaGraf&produkt='+code+'&oblast='+region;
  const graph=c.appReadResource(c.pharmaGrafRequestUrl('AFLsach','KE'));
  c.APP_READ_REUSE[graph.key]={json:JSON.stringify({ok:true,rows:[{nas_ms:1}]}),ts:Date.now(),ctx:c.appLineCapture(),version:c.APP_READ_REUSE_VERSION};
  const a=s.indexOf('function pharmaGrafFromMain('),b=s.indexOf('\nfunction ',a+1);vm.runInContext(s.slice(a,b),c);
  c.pharmaGrafFromMain('AFLsach','KE',{ok:true,graf:{rows:[{nas_ms:18}]}},'AFLsach_KE','synthetic-graph');
  assert.equal(c.appReadReuse(graph).data.rows[0].nas_ms,18,'A warm graph read must reuse the newly verified bundled values');
  console.log(file+': explicit visible reads bypass server cache; automatic reads, writes, credentials and unrelated scopes stay intact');
 }
})().catch(e=>{console.error(e);process.exit(1);});
