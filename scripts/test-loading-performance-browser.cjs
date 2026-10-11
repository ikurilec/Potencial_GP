const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.SATORI_PLAYWRIGHT||'playwright'),root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));let reads=[],hold=false,blocked=[];
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname==='satori.test'){
   let f=u.pathname==='/'?'index.html':u.pathname.slice(1);
   if(!process.env.SATORI_TEST_BUILD&&/^dist\/app\..*\.js$/.test(f))f='app.js';
   const file=path.resolve(root,f);if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.abort();
   return route.fulfill({body:fs.readFileSync(file),contentType:f.endsWith('.js')?'application/javascript':f.endsWith('.css')?'text/css':f.endsWith('.html')?'text/html':undefined});
  }
  if(u.hostname.includes('script.google')){
   const action=u.searchParams.get('action');
   if(action==='getPharmaData'||action==='getPharmaGraf'){
    reads.push(u);if(hold)await new Promise(resolve=>blocked.push({route,resolve}));else await new Promise(r=>setTimeout(r,160));
    const rows=[{mesiac:'2608',nas_ms:9},{mesiac:'2609',nas_ms:10}];
    const json=action==='getPharmaGraf'?{ok:true,rows}:{ok:true,summary:[{mesiac:'2608',terit_ms:.09,sk_ms:.08},{mesiac:'2609',terit_ms:.1,sk_ms:.08}],okresy:[],okresy_prev:[],kvartal_prev:'2602',graf:{ok:true,rows}};
    try{return await route.fulfill({json});}catch(e){return;}
   }
   return route.fulfill({json:{ok:true,posts:[],events:[],reps:[],rows:[],value:''}});
  }
  return route.abort();
 });
 await page.goto('https://satori.test/');await page.waitForFunction(()=>typeof loadPharmaDataNetwork==='function');
 for(const line of ['gp','reagila'])for(const role of ['rep east','rep west','admin','boss','bum','pm','am east','am west','am']){
  reads=[];
  await page.evaluate(({line,role})=>{
   closeAllPanels();appLineBumpEpoch();localStorage.clear();IS_DEV=false;
   getSession=()=>({username:'performance-'+role,line,role,region:'KE',session_token:'synthetic'});
   document.getElementById('login-screen').style.display='none';document.body.classList.remove('login-active','gyn-line');document.body.classList.toggle('reagila-line',line==='reagila');
   document.querySelector('.app').style.visibility='visible';PHARMA_STATE.cache={};PHARMA_STATE.loading={};PHARMA_STATE.requests={};
   PHARMA_GRAF_STATE.cache={};PHARMA_GRAF_STATE.loading={};PHARMA_GRAF_WAITERS={};
   _phIdbSupported=()=>false;_phLsLoad=()=>null;usageSectionEnter=()=>{};satoriGuideQueueHint=()=>{};
   if(line==='reagila')reagilaApplyPharmaMaps_();else golemRestorePharmaMaps_();
   openPharmaMs(line==='gp'?'aflamil_kr':'reagila','Produkt','KE',null,{q:3,year:2026});
  },{line,role});
  await page.waitForFunction(()=>Object.keys(PHARMA_STATE.cache).length && !Object.keys(PHARMA_STATE.loading).length);
  await page.waitForTimeout(200);
  assert.equal(reads.length,1,line+'/'+role+': cold market opens with one combined request');
  assert.equal(reads[0].searchParams.get('graf'),'1');assert.equal(await page.locator('#pharma-graf-chart svg').count(),1);
  // Recent successfully verified data are painted synchronously without another network read.
  await page.evaluate(()=>{closePharmaMs();document.getElementById('pharma-ms-body').innerHTML='';});
  const painted=await page.evaluate(line=>{openPharmaMs(line==='gp'?'aflamil_kr':'reagila','Produkt','KE',null,{q:3,year:2026});return document.getElementById('pharma-ms-body').textContent.includes('TRHOVÝ PODIEL');},line);
  assert.equal(painted,true,'Warm data renders in the opening task, before the server response');
  await page.waitForFunction(()=>!Object.keys(PHARMA_STATE.loading).length);await page.waitForTimeout(50);
  assert.equal(reads.length,1,'A short warm return reuses the valid combined response without another graph or verification');
 }
 for(const role of ['gyn-rep','gyn-am','gyn-manager','admin','boss','bum','pm','am','asistent']){
  reads=[];
  await page.evaluate(role=>{
   closeAllPanels();appLineBumpEpoch();localStorage.clear();IS_DEV=false;
   getSession=()=>({username:'gyn-performance-'+role,line:'gyn',role,region:'BAPI',session_token:'synthetic'});
   document.body.classList.remove('reagila-line');document.body.classList.add('gyn-line');
   GYN_APP.q=3;GYN_APP.year=2026;GYN_PHARMA_STATE.cache={};GYN_PHARMA_STATE.loading={};
   gynOpenPharma('Belara','BAPI');
  },role);
  await page.waitForFunction(()=>Object.keys(GYN_PHARMA_STATE.cache).length && !Object.keys(GYN_PHARMA_STATE.loading).length);
  await page.waitForTimeout(150);assert.equal(reads.length,1,'Gyn cold '+role+' does not download known-empty historical quarters');
  assert.equal(reads[0].searchParams.get('extra'),'1');
  const painted=await page.evaluate(()=>{gynClosePharma();gynOpenPharma('Belara','BAPI');return !document.getElementById('pharma-ms-body').querySelector('.gyn-pharma-loading');});
  assert.equal(painted,true,'Gyn warm '+role+' shows the cache synchronously');
  await page.waitForFunction(()=>!Object.keys(GYN_PHARMA_STATE.loading).length);await page.waitForTimeout(50);
  assert.equal(reads.length,2,'Gyn warm opening verifies once');
 }
 // A slow prefetch must not retain the client slot after switching lines.
 hold=true;reads=[];
 await page.evaluate(()=>{
  closeAllPanels();PHARMA_STATE.cache={};PHARMA_STATE.loading={};PHARMA_STATE.requests={};
  window.oldRead=appQueuedFetchJson(scriptUrl('action=getPharmaData&produkt=Old&oblast=KE&kvartal=2603'),undefined,30000,'background').then(()=>false,()=>true);
 });
 await page.waitForFunction(()=>APP_REQUEST_QUEUE.running.length>0);await page.waitForTimeout(30);
 await page.evaluate(()=>{appLineBumpEpoch();});
 assert.equal(await page.evaluate(()=>oldRead),true,'Obsolete reads are canceled');
 await page.waitForFunction(()=>APP_REQUEST_QUEUE.active===0);
 blocked.splice(0).forEach(b=>b.resolve());hold=false;
 assert.deepEqual(errors,[]);
 console.log('27 line/role cold market screens: one combined read, synchronous warm rendering and canceled obsolete transfers passed');
 await page.unrouteAll({behavior:'ignoreErrors'});await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
