const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.SATORI_PLAYWRIGHT||'playwright'),root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));let calls=[],failFirst=false,failAlways=false,zeroShare=false,oldTablets=false,emptyMarket=false,holdStock=false,releaseStock;
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname==='satori.test'){
   let file=u.pathname==='/'?'index.html':u.pathname.slice(1);
   if(!process.env.SATORI_TEST_BUILD&&/^dist\/app\..*\.(js|css)$/.test(file))file=file.endsWith('.js')?'app.js':'app.css';
   const f=path.resolve(root,file);if(!f.startsWith(root+path.sep)||!fs.existsSync(f))return route.abort();
   return route.fulfill({body:fs.readFileSync(f),contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html'});
  }
  if(!u.hostname.includes('script.google'))return route.abort();
  const action=u.searchParams.get('action'),code=u.searchParams.get('produkt'),q=u.searchParams.get('kvartal');calls.push({action,code,q});
  if(action==='getStockData'&&holdStock)await new Promise(r=>releaseStock=r);
  if(failAlways || (failFirst && calls.filter(c=>c.action===action&&c.code===code).length===1))return route.fulfill({json:{ok:false,error:'Transient backend failure'}});
  let data={ok:true,rows:[],events:[],posts:[],plan:{},predaje:{}};
  if(action==='getStockData')data={ok:true,as_of:'2026-10-05',rows:[{line:'reagila',product_key:'reagila',product:'Reagila',availability:'available',coverage_days:30}]};
  if(action==='getPharmaData'){
   const month=oldTablets&&code==='AFLtbl'?'2605':'2608';
   data={ok:true,summary:[{mesiac:month,terit_ms:zeroShare?0:8,sk_ms:zeroShare?0:10}],
    okresy:q===(month==='2605'?'2602':'2603')?[{okres:'Košice',nas_m2:zeroShare?0:8,tot_pat_m2:1000,k1:{name:'Konkurent',m2:40}}]:[],
    okresy_prev:[],kvartal_prev:q==='2603'?'2602':'2601',graf:{rows:[{mesiac:String(Number(month)-1),nas_ms:zeroShare?0:7,k1_nazov:'Konkurent',k1_ms:39},{mesiac:month,nas_ms:zeroShare?0:8,k1_nazov:'Konkurent',k1_ms:40}]}};
  }
  if(action==='getPharmaGraf')data={ok:true,rows:[]};
  if(action==='getPharmaData'&&emptyMarket)data={ok:true,summary:[],okresy:[],okresy_prev:[],graf:{rows:[]}};
  await new Promise(r=>setTimeout(r,30));return route.fulfill({json:data});
 });
 await page.goto('https://satori.test/');await page.waitForFunction(()=>typeof appTrackedRead==='function');
 async function reset(line,role){
  calls=[];await page.evaluate(({line,role})=>{
   closeAllPanels();appLineBumpEpoch();localStorage.clear();IS_DEV=false;
   getSession=()=>({username:'recovery-'+role,role,line,region:'KE',session_token:'synthetic'});
   document.querySelectorAll('.show').forEach(el=>el.classList.remove('show'));document.body.classList.remove('login-active','mgr-plnenie-detail-open');
   document.getElementById('login-screen').style.display='none';document.querySelector('.app').style.visibility='visible';
   document.body.classList.toggle('gyn-line',line==='gyn');document.body.classList.toggle('reagila-line',line==='reagila');document.body.classList.toggle('manager-mode',!/rep|kam/.test(role));
   APP_READ_META={};APP_READ_CHECKS={};APP_READ_REUSE={};APP_READ_PRESENTATION={};APP_MANUAL_REFRESH_UNTIL=0;
   PHARMA_STATE.cache={};PHARMA_STATE.loading={};PHARMA_STATE.requests={};PHARMA_GRAF_STATE.cache={};PHARMA_GRAF_STATE.loading={};PHARMA_GRAF_WAITERS={};
   SKLADY_STATE.payload=null;SKLADY_STATE.open=false;PL_PROD_SHEET_STATE.open=false;
   _phIdbSupported=()=>false;_phLsLoad=()=>null;usageSectionEnter=()=>{};satoriGuideQueueHint=()=>{};
   dnesRefreshIfOpen=()=>{};golemRestorePharmaMaps_();
  },{line,role});
 }
 // A tablet fallback must not choose the quarter of the sachets detail.
 oldTablets=true;await reset('gp','admin');
 await page.evaluate(()=>openPharmaMs('aflamil_tablety_sacky','Aflamil tbl a sáčky','KE',null,{q:3,year:2026}));
 await page.waitForFunction(()=>PHARMA_STATE.kvartal==='2602'&&document.querySelector('#pharma-graf-chart svg'));
 await page.locator('#pharma-ms-subtabs [data-code="AFLsach"]').click();
 await page.waitForFunction(()=>PHARMA_STATE.cache['AFLsach_KE_2603']);
 assert.equal(await page.evaluate(()=>PHARMA_STATE.kvartal),'2603');assert.match(await page.locator('#pharma-ms-title').innerText(),/Q3 2026/);
 oldTablets=false;failFirst=true;
 for(const role of ['admin','boss','bum','am west','am east','am','rep west','rep east']){
  await reset('gp',role);
  await page.evaluate(()=>{openPharmaMs('aflamil_tablety_sacky','Aflamil','KE',null,{q:3,year:2026});pharmaSwitchTab('AFLsach');});
  await page.waitForFunction(()=>PHARMA_STATE.cache['AFLsach_KE_2603']&&!PHARMA_STATE.loading['AFLsach_KE_2603']);
  assert.equal(calls.filter(c=>c.action==='getPharmaData'&&c.code==='AFLsach').length,2,'Sachets recover from a transient server failure');
  assert.match(await page.locator('#pharma-ms-body').innerText(),/Košice/);assert.equal(await page.locator('#pharma-graf-chart svg').count(),1);
  await page.evaluate(()=>appReadRefreshVisible());assert.equal(await page.locator('[data-read-check]').getAttribute('data-read-status'),'verified');
 }
 for(const role of ['admin','boss','bum','am west','am east','am','kam']){
  await reset('reagila',role);await page.evaluate(()=>openSklady());
  await page.waitForFunction(()=>SKLADY_STATE.payload?.products.length===1);
  assert.equal(calls.filter(c=>c.action==='getStockData').length,2,'Reagila stock retries a failed API reply');
  assert.match(await page.locator('#sklady-body').innerText(),/Reagila/);
  await page.evaluate(()=>appReadRefreshVisible());assert.equal(await page.locator('[data-read-check]').getAttribute('data-read-status'),'verified');
 }
 failFirst=false;failAlways=true;calls=[];
 await page.evaluate(()=>stockForceRefresh());
 await page.waitForFunction(()=>!APP_READ_CHECKS[appReadView().key]?.pending&&appReadSummary(appReadView()).error);
 await page.evaluate(()=>appReadRefreshVisible());
 assert.equal(calls.filter(c=>c.action==='getStockData').length,2,'Persistent stock failure stops after its retry budget');
 assert.equal(await page.locator('[data-read-check]').getAttribute('data-read-status'),'error');assert.match(await page.locator('#sklady-body').innerText(),/Reagila/);
 failAlways=false;await page.locator('[data-read-check] > .app-err-btn').click();
 await page.waitForFunction(()=>!APP_READ_CHECKS[appReadView().key]?.pending&&!appReadSummary(appReadView()).error);
 await page.evaluate(()=>appReadRefreshVisible());assert.equal(await page.locator('[data-read-check]').getAttribute('data-read-status'),'verified');
 // Opening during preload subscribes to the same result, including unchanged data.
 await reset('reagila','admin');holdStock=true;
 await page.evaluate(()=>stockPreload(true));await page.waitForFunction(()=>APP_REQUEST_QUEUE.running.some(r=>r.resource?.action==='getStockData'));
 while(!releaseStock)await page.waitForTimeout(20);
 await page.evaluate(()=>openSklady());assert.equal(await page.locator('[data-read-check]').getAttribute('data-read-status'),'pending');
 holdStock=false;releaseStock();releaseStock=null;
 await page.waitForFunction(()=>SKLADY_STATE.payload?.products.length===1&&!APP_READ_CHECKS[appReadView().key]?.pending);
 assert.equal(calls.filter(c=>c.action==='getStockData').length,1,'Preload and opening share one stock request');
 zeroShare=true;await reset('gp','admin');
 await page.evaluate(()=>{openPharmaMs('aflamil_tablety_sacky','Aflamil','KE',null,{q:3,year:2026});pharmaSwitchTab('AFLsach');});
 await page.waitForFunction(()=>!Object.keys(PHARMA_STATE.loading).length&&PHARMA_STATE.cache['AFLsach_KE_2603']);
 assert.equal(await page.evaluate(()=>PHARMA_STATE.kvartal),'2603','Zero own share with a real competitor market must load in the selected quarter');
 assert.match(await page.locator('#pharma-ms-body').innerText(),/0[.,]00%/);
 assert.equal(await page.locator('#pharma-graf-chart svg polyline').count()>1,true,'Zero own share remains visible alongside the competitor trend');
 zeroShare=false;emptyMarket=true;await reset('gp','admin');
 await page.evaluate(()=>openPharmaMs('aflamil_kr','Aflamil krém','KE',null,{q:3,year:2026}));
 await page.waitForFunction(()=>PHARMA_STATE.cache['AFLcrm_KE_2603']&&!Object.keys(PHARMA_STATE.loading).length);
 assert.equal(calls.filter(c=>c.action==='getPharmaData').length,1,'Empty market replies do not fetch ever older quarters');
 assert.match(await page.locator('#pharma-ms-body').innerText(),/zatiaľ nie sú nahraté trhové údaje/);
 await page.evaluate(()=>appReadRefreshVisible());assert.equal(await page.locator('[data-read-check]').getAttribute('data-read-status'),'verified');emptyMarket=false;
 // An obsolete manual failure and an unrelated historical read must not paint
 // a red Home summary when every displayed dependency has just succeeded.
 for(const role of ['admin','boss','bum','gyn-manager','gyn-am','gyn-rep']){
  await reset('gyn',role);
  const state=await page.evaluate(async()=>{
   document.getElementById('dnes-overlay').classList.add('show');_panelCurrent='dnes-overlay';
   plnenieDefaultPeriod=()=>({q:3,year:2026});plnenieCalendarPeriod=()=>({q:4,year:2026});gynLbLastCompletedQ=()=>4;
   const view=appReadView();
   for(const query of ['getPlnenieAll&rok=2026&Q=3','getPlnenieAll&rok=2026&Q=4','getNastenka','getCalEvents','getStockData']){
    const r=appReadResource(gynScriptUrl('action='+query));r.visible=true;r.reuseVersion=APP_READ_REUSE_VERSION;appReadRemember(r,Date.now(),false);
   }
   const entry=APP_READ_CHECKS[view.key]={view,ctx:appLineCapture(),pending:0,error:true,failures:{manual:true}};
   appReadPaint(entry);const el=document.querySelector('[data-read-check]');
   return {status:el.dataset.readStatus,groups:appReadSummary(view).groups.map(g=>g.state)};
  });
  assert.ok(state.groups.every(s=>s==='verified'));assert.equal(state.status,'verified','Green Gyn rows and the Home result must agree');
 }
 assert.deepEqual(errors,[]);await page.unrouteAll({behavior:'ignoreErrors'});await browser.close();
 console.log('Aflamil form quarters/zero share/API recovery, Reagila stock recovery and consistent Gyn Home status passed');
})().catch(e=>{console.error(e);process.exit(1);});
