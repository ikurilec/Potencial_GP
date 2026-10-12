const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.SATORI_PLAYWRIGHT||'playwright'),root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));let calls=[],delay=25,offline=false,value=12,customSales=null;
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname==='satori.test'){
   let f=u.pathname==='/'?'index.html':u.pathname.slice(1);
   if(!process.env.SATORI_TEST_BUILD&&/^dist\/app\..*\.(js|css)$/.test(f))f=f.endsWith('.js')?'app.js':'app.css';
   const file=path.resolve(root,f);if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.abort();
   return route.fulfill({body:fs.readFileSync(file),contentType:f.endsWith('.js')?'application/javascript':f.endsWith('.css')?'text/css':'text/html'});
  }
  if(!u.hostname.includes('script.google'))return route.abort();
  calls.push(u);await new Promise(r=>setTimeout(r,delay));
  if(u.searchParams.get('action')==='getPharmaData'){
   if(offline||u.searchParams.get('fresh')!=='1')return route.fulfill({json:{ok:false,error:'Cached backend failure'}});
   const ratio=u.searchParams.get('produkt')==='Belara';
   return route.fulfill({json:{ok:true,summary:[{mesiac:'2608',terit_ms:ratio?value/100:value,sk_ms:ratio?(value-2)/100:value-2}],okresy:[{okres:'Košice',nas_m2:value}],okresy_prev:[],kvartal_prev:'2602',graf:{rows:[{mesiac:'2608',nas_ms:value},{mesiac:'2609',nas_ms:value+1}]}}});
  }
  if(u.searchParams.get('action')==='getPlnenieAll')return route.fulfill({json:customSales||{ok:true,plan:{colleague:{aflamil_tablety_sacky:100,reagila:100,belara:100}},predaje:{colleague:{total:{aflamil_tablety_sacky:50,reagila:50,belara:50}}}}});
  return route.fulfill({json:{ok:true,plan:{},predaje:{},reps:[],rows:[],posts:[],events:[]}});
 });
 await page.goto('https://satori.test/');await page.waitForFunction(()=>typeof openProdSheet==='function');
 async function reset(line,role){
  customSales=null;
  await page.evaluate(({line,role})=>{
   closeAllPanels();appLineBumpEpoch();localStorage.clear();IS_DEV=false;
   getSession=()=>({username:'refresh-'+role,role,line,region:line==='gyn'?'BAPI':line==='reagila'?'BA':'KE',session_token:'synthetic'});
   document.querySelectorAll('.show').forEach(e=>e.classList.remove('show'));document.body.classList.remove('login-active','mgr-plnenie-detail-open');
   document.getElementById('login-screen').style.display='none';document.querySelector('.app').style.visibility='visible';
   document.body.classList.toggle('manager-mode',!/rep|kam/.test(role));document.body.classList.toggle('gyn-line',line==='gyn');document.body.classList.toggle('reagila-line',line==='reagila');
   APP_READ_META={};APP_READ_CHECKS={};APP_READ_REUSE={};APP_READ_PRESENTATION={};APP_MANUAL_REFRESH_UNTIL=0;
   PHARMA_STATE.cache={};PHARMA_STATE.loading={};PHARMA_STATE.requests={};PHARMA_STATE.revalidated={};PHARMA_GRAF_STATE.cache={};PHARMA_GRAF_STATE.loading={};PHARMA_GRAF_WAITERS={};
   GYN_PHARMA_STATE.cache={};GYN_PHARMA_STATE.loading={};GYN_PHARMA_STATE.requests={};GYN_PHARMA_STATE.open=false;
   PL_STATE.q=GYN_APP.q=3;PL_STATE.year=GYN_APP.year=2026;GYN_APP.plCache={};GYN_APP.plLoading={};
   USERS_LOCAL.colleague={name:'Kolega',role:'rep west',region:line==='gyn'?'BAPI':line==='reagila'?'BA':'KE'};
   plnenieGetActiveReps=()=>['colleague'];GYN_STATE.repList=[{login:'colleague',name:'Kolega',region:'BAPI'}];
   _phIdbSupported=()=>false;_phLsLoad=()=>null;usageSectionEnter=()=>{};usageDrill=()=>{};satoriGuideQueueHint=()=>{};dnesRefreshIfOpen=()=>{};
   golemRestorePharmaMaps_();if(line==='reagila')reagilaApplyPharmaMaps_();
   PL_STATE.loaded=true;PL_STATE._currentLoading=false;PL_STATE.data={ok:true,plan:{colleague:{aflamil_tablety_sacky:100,reagila:100}},predaje:{colleague:{total:{aflamil_tablety_sacky:50,reagila:50}}}};
   PL_STATE.aggregates=plnenieBuildAggregates(PL_STATE.data,3);
   GYN_APP.plCache[3]={ok:true,plan:{colleague:{belara:100}},predaje:{colleague:{total:{belara:50}}}};
  },{line,role});calls=[];
 }
 await reset('gp','admin');
 await page.evaluate(()=>{openProdSheet('aflamil_tablety_sacky','Aflamil');prodSheetSwitchPharmaCode('AFLsach');});
 await page.waitForFunction(()=>!Object.keys(PHARMA_STATE.requests).length&&!Object.keys(PHARMA_STATE.loading).length);
 await page.evaluate(()=>appReadRefreshVisible());
 assert.equal(await page.evaluate(()=>appReadSummary(appReadView()).groups.some(g=>g.error)),true);
 await page.locator('[data-read-check] summary').tap();
 const detailsBefore=await page.locator('[data-read-check] details').elementHandle();
 calls=[];await page.locator('[data-read-check] details > .app-err-btn').tap();await page.waitForTimeout(300);
 assert.equal(await page.evaluate(before=>document.querySelector('[data-read-check] details')===before,detailsBefore),true,'Status changes must preserve the actual disclosure and retry button');
 assert.ok(calls.some(u=>u.searchParams.get('produkt')==='AFLsach'&&u.searchParams.get('fresh')==='1'),'Product retry must request fresh sachet market data, not only sales');
 await page.waitForFunction(()=>document.querySelector('[data-read-check]')?.dataset.readStatus==='verified');
 assert.match(await page.locator('#pl-ps-body').innerText(),/12[.,]00%/);
 const scoped=await page.evaluate(()=>{
  for(const query of ['getPharmaData&produkt=AFLsach&oblast=PO&kvartal=2603','getPharmaData&produkt=AFLsach&oblast=KE&kvartal=2601','getPharmaData&produkt=AFLcrm&oblast=KE&kvartal=2603']){
   const r=appReadResource(scriptUrl('action='+query));r.visible=true;appReadRemember(r,Date.now(),true);
  }
  return appReadSummary(appReadView()).groups.filter(g=>g.id.startsWith('market|')).map(g=>({id:g.id,label:g.label,error:g.error}));
 });
 assert.equal(scoped.length,1,'Other territories, forms and periods must not enter this product status');assert.match(scoped[0].label,/KE/);assert.equal(scoped[0].error,false);
 console.log('Product button requests fresh selected-form market data, updates cells and excludes unrelated status rows');
 value=18;calls=[];await page.evaluate(()=>appReadRetryCurrent());await page.waitForFunction(()=>PHARMA_STATE.cache['AFLsach_KE_2603']?.summary[0].terit_ms===18&&!APP_READ_CHECKS[appReadView().key]?.pending);
 assert.match(await page.locator('#pl-ps-sub').innerText(),/16[.,]00%/,'National header changes after refresh as well');value=12;
 // The same shared control must recover a failed detail and preserve cached content.
 await reset('gp','rep east');await page.evaluate(()=>{openPharmaMs('aflamil_tablety_sacky','Aflamil','KE',null,{q:3,year:2026});pharmaSwitchTab('AFLsach');});
 await page.waitForFunction(()=>!Object.keys(PHARMA_STATE.requests).length&&!Object.keys(PHARMA_STATE.loading).length);await page.evaluate(()=>appReadRefreshVisible());
 calls=[];await page.locator('[data-read-check] .app-read-main > .app-err-btn').tap();
 await page.waitForFunction(()=>document.querySelector('[data-read-check]')?.dataset.readStatus==='verified');
 assert.equal(calls.filter(u=>u.searchParams.get('action')==='getPharmaData').length,1,'Detail retry uses a single combined market/graph request');
 assert.equal(calls[0].searchParams.get('fresh'),'1');assert.match(await page.locator('#pharma-ms-body').innerText(),/12[.,]00%/);
 offline=true;delay=80;calls=[];await page.evaluate(()=>appReadRetryCurrent());
 await page.waitForFunction(()=>document.querySelector('[data-read-check]')?.dataset.readStatus==='error');
 assert.match(await page.locator('#pharma-ms-body').innerText(),/12[.,]00%/);assert.equal(calls.filter(u=>u.searchParams.get('action')==='getPharmaData').length,2);
 offline=false;calls=[];await page.locator('[data-read-check] .app-read-main > .app-err-btn').tap();await page.waitForFunction(()=>document.querySelector('[data-read-check]')?.dataset.readStatus==='verified');
 console.log('Mobile sachet detail retry bypasses backend cache, finishes, preserves cached content on failure and recovers');
 let count=0;
 const roles={gp:['admin','boss','bum','pm','am west','am east','am'],reagila:['admin','boss','bum','pm','am west','am east','am'],gyn:['admin','boss','bum','gyn-manager','gyn-am']};
 for(const line of Object.keys(roles))for(const role of roles[line]){
  if(process.env.SATORI_REFRESH_FOCUS)continue;
  await reset(line,role);
  await page.evaluate(line=>{if(line==='gyn')gynOpenProdSheet('Belara');else if(line==='reagila')openProdSheet('reagila','Reagila');else{openProdSheet('aflamil_tablety_sacky','Aflamil');prodSheetSwitchPharmaCode('AFLsach');}},line);
  await page.waitForFunction(()=>!Object.keys(PHARMA_STATE.requests).length&&!Object.keys(PHARMA_STATE.loading).length&&!Object.keys(GYN_PHARMA_STATE.loading).length);
  await page.evaluate(()=>appReadRefreshVisible());
  if(!await page.locator('[data-read-check] details').evaluate(el=>el.open))await page.locator('[data-read-check] summary').tap();calls=[];
  await page.locator('[data-read-check] details > .app-err-btn').tap();
  await page.waitForFunction(()=>document.querySelector('[data-read-check]')?.dataset.readStatus==='verified');
  const market=calls.filter(u=>u.searchParams.get('action')==='getPharmaData');
  assert.equal(market.length,1,line+' '+role+': one combined request per visible territory');assert.equal(market[0].searchParams.get('fresh'),'1');
  assert.match(await page.locator('#pl-ps-body').innerText(),/12[.,]00%/,line+' '+role);count++;
 }
 console.log(count+' actual product refreshes across all three lines and manager roles passed');
 // A stalled local cache read must not block an explicit network retry.
 await reset('gp','admin');
 await page.evaluate(()=>{
  window.releaseIdb={};_phIdbSupported=()=>true;_phIdbLoad=code=>new Promise(resolve=>releaseIdb[code]=resolve);
  openPharmaMs('aflamil_tablety_sacky','Aflamil','KE',null,{q:3,year:2026});pharmaSwitchTab('AFLsach');
 });
 calls=[];await page.evaluate(()=>appReadRetryCurrent());
 await page.waitForFunction(()=>PHARMA_STATE.cache['AFLsach_KE_2603']?.summary[0].terit_ms===12);
 await page.evaluate(()=>{for(const code of Object.keys(releaseIdb))releaseIdb[code]({ok:true,summary:[{mesiac:'2608',terit_ms:1,sk_ms:1}],okresy:[]});});await page.waitForTimeout(120);
 assert.equal(await page.evaluate(()=>PHARMA_STATE.cache['AFLsach_KE_2603'].summary[0].terit_ms),12,'Late IndexedDB cannot replace a successful network refresh');
 console.log('Explicit refresh bypasses a stalled local-cache read and ignores its late stale reply');
 await reset('gyn','gyn-rep');await page.evaluate(()=>gynOpenPharma('Belara','BAPI'));
 await page.waitForFunction(()=>!Object.keys(GYN_PHARMA_STATE.loading).length&&!Object.keys(GYN_PHARMA_STATE.requests||{}).length);await page.evaluate(()=>appReadRefreshVisible());
 calls=[];await page.locator('[data-read-check] .app-read-main > .app-err-btn').tap();
 await page.waitForFunction(()=>GYN_PHARMA_STATE.cache['Belara|BAPI|2603']&&document.querySelector('[data-read-check]')?.dataset.readStatus==='verified');
 assert.equal(calls.filter(u=>u.searchParams.get('action')==='getPharmaData').length,1);assert.equal(calls[0].searchParams.get('fresh'),'1');
 const cachedBody=await page.locator('#pharma-ms-body').innerText();offline=true;await page.evaluate(()=>appReadRetryCurrent());
 await page.waitForFunction(()=>document.querySelector('[data-read-check]')?.dataset.readStatus==='error');
 assert.equal(await page.locator('#pharma-ms-body').innerText(),cachedBody,'Gyn failed retry preserves its complete cached detail');offline=false;
 console.log('Gyn detail retry is fresh and keeps cached market data visible during an outage');
 // A large status list must scroll inside the sheet and keep its action reachable.
 await reset('gp','admin');await page.evaluate(()=>{openProdSheet('aflamil_tablety_sacky','Aflamil');prodSheetSwitchPharmaCode('AFLsach');});
 await page.waitForFunction(()=>!Object.keys(PHARMA_STATE.requests).length&&!Object.keys(PHARMA_STATE.loading).length);
 customSales=await page.evaluate(()=>{
  const regions=['KE','LV','MI','PO','PP','RS','BAMA','BASE','DS','MT','NR','TN'];
  plnenieGetActiveReps=()=>regions.map(r=>'scroll-'+r);
  for(const region of regions){const login='scroll-'+region;USERS_LOCAL[login]={region,name:login};PL_STATE.data.plan[login]={aflamil_tablety_sacky:100};const r=appReadResource(scriptUrl('action=getPharmaData&produkt=AFLsach&oblast='+region+'&kvartal=2603'));r.visible=true;appReadRemember(r,Date.now(),true);}
  appReadRefreshVisible();
  return PL_STATE.data;
 });
 await page.setViewportSize({width:320,height:700});
 if(!await page.locator('[data-read-check] details').evaluate(el=>el.open))await page.locator('[data-read-check] summary').tap();
 const bounds=await page.locator('[data-read-check]').evaluate(el=>({height:el.getBoundingClientRect().height,rows:el.querySelector('.app-read-sections').scrollHeight,client:el.querySelector('.app-read-sections').clientHeight,overflow:el.scrollWidth>el.clientWidth+1}));
 assert.ok(bounds.height<=700*.45+1);assert.ok(bounds.rows>bounds.client);assert.equal(bounds.overflow,false);
 await page.screenshot({path:path.join(root,'.tmp-market-status-mobile.png')});
 await page.evaluate(()=>{window.retryDebug=[];const retry=appReadRetryCurrent;appReadRetryCurrent=()=>{retryDebug.push(appReadView().params);return retry();};});
 calls=[];await page.locator('[data-read-check] details > .app-err-btn').tap();await page.waitForTimeout(150);
 await page.waitForFunction(()=>!APP_READ_CHECKS[appReadView().key]?.pending);
 assert.equal(await page.evaluate(()=>retryDebug.length),1,'The mobile tap must trigger exactly one retry');
 assert.equal(calls.filter(u=>u.searchParams.get('action')==='getPharmaData'&&u.searchParams.get('fresh')==='1').length,12,'Every visible territory must complete a fresh market read');
 assert.equal(await page.evaluate(()=>appReadSummary(appReadView()).groups.every(g=>g.state==='verified')),true,'Every scoped row finishes successfully');
 console.log('Long status lists fit the mobile sheet and their retry action works at 320px');
 assert.deepEqual(errors,[]);await page.unrouteAll({behavior:'ignoreErrors'});await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
