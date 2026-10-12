const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.SATORI_PLAYWRIGHT||'playwright'),root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true});const errors=[];let cases=0;
 for(const mobile of [true,false]){
  const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:900},isMobile:mobile,hasTouch:mobile});
  page.on('pageerror',e=>errors.push(e.message));let fail=true,failOverview=false,calls=[],overviewCalls=[];
  await page.route('**/*',async route=>{
   const u=new URL(route.request().url());
   if(u.hostname==='satori.test'){
    let f=u.pathname==='/'?'index.html':u.pathname.slice(1);
    if(!process.env.SATORI_TEST_BUILD&&/^dist\/app\..*\.(js|css)$/.test(f))f=f.endsWith('.js')?'app.js':'app.css';
    const file=path.resolve(root,f);if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.abort();
    return route.fulfill({body:fs.readFileSync(file),contentType:f.endsWith('.js')?'application/javascript':f.endsWith('.css')?'text/css':'text/html'});
   }
   if(!u.hostname.includes('script.google'))return route.abort();
   if(u.searchParams.get('action')==='getPharmaOverview'){
    overviewCalls.push(u);await new Promise(r=>setTimeout(r,35));
    return route.fulfill({json:failOverview?{ok:false,error:'Temporary overview error'}:{ok:true,rows:[]}});
   }
   if(u.searchParams.get('action')==='getPharmaData'){
    calls.push(u);await new Promise(r=>setTimeout(r,35));
    return route.fulfill({json:fail&&u.searchParams.get('produkt')==='AFLsach'?{ok:false,error:'Temporary market error'}:{ok:true,summary:[],okresy:[]}});
   }
   return route.fulfill({json:{ok:true,posts:[],events:[],rows:[],reps:[],plan:{},predaje:{}}});
  });
  await page.goto('https://satori.test/');await page.waitForFunction(()=>typeof rptViewEnsurePharma==='function');
  const roles=['admin','boss','bum','pm','am','am west','am east','amwest'],regions=['BA','TN','NR','LV','RS','MT','KE','PO'];
  for(let i=0;i<roles.length;i++){
   fail=true;calls=[];
   await page.evaluate(({role,region})=>{
    closeAllPanels();appLineBumpEpoch();localStorage.clear();IS_DEV=false;
    getSession=()=>({username:'report-test-'+role,line:'gp',role,region,session_token:'synthetic'});
    document.querySelectorAll('.show').forEach(el=>el.classList.remove('show'));
    document.body.classList.remove('login-active','gyn-line','reagila-line','mgr-plnenie-detail-open');
    document.body.classList.add('manager-mode','mgr-subtab-reporty');document.getElementById('mgr-view').classList.add('show');
    document.getElementById('login-screen').style.display='none';document.querySelector('.app').style.visibility='visible';MGR_STATE.subtab='reporty';
    APP_READ_META={};APP_READ_CHECKS={};APP_READ_REUSE={};APP_READ_PRESENTATION={};APP_MANUAL_REFRESH_UNTIL=0;
    golemRestorePharmaMaps_();USERS_LOCAL.rep={region};PHARMA_STATE.cache={};PHARMA_GRAF_STATE.cache={};
    RPT_VIEW={scope:'rep',username:'rep',pharmaLoadedOblasts:{},pharmaWant:'all',pharmaRefresh:true};
    rptViewPeriod=()=>({q:3,year:2026,month:9});RP2_LAST.m={prods:[{key:'aflamil_tablety_sacky',g100:100},{key:'aflamil_kr',g100:50},{key:'suprax',g100:20}]};
    PHARMA_STATE.cache['AFLsach_'+region+'_2603']={ok:true,summary:[],okresy:[]};
    const host=document.getElementById('mgr-reporty-view');host.innerHTML='<div id="test-market"></div>';host.classList.add('show');host.style.display='block';
    rp2Schedule=()=>{document.getElementById('test-market').innerHTML=rptViewPharmaStatusHtml()||'<div>Trhové dáta načítané</div>';appReadRefreshVisible();};
    rp2EnsureQuarter_=rp2LoadCennik=gynCalSync=rp2DohLoad=()=>{};RP2_DOH.loading=false;
    // Persistent failures from other screens used to leak into this report.
    const other=appReadResource(scriptUrl('action=getPharmaData&produkt=AFLcrm&oblast=BASE&kvartal=2602'));
    APP_READ_META[other.key]=Object.assign({},other,{ts:Date.now()-86400000,attempt:Date.now(),failed:true,failureVisible:true});
    const sales=appReadResource(scriptUrl('action=getPlnenieAll&rok=2026&Q=3'));sales.visible=true;appReadRemember(sales,Date.now(),false);
    rptViewEnsurePharma(RP2_LAST.m);rp2Schedule();
   },{role:roles[i],region:regions[i]});
   await page.waitForFunction(()=>!RPT_VIEW.pharmaLoading);
   assert.equal(calls.filter(u=>u.searchParams.get('produkt')==='AFLsach').length,2,'Selected sachets are fetched, including the transient retry');
   let state=await page.evaluate(()=>appReadSummary(appReadView()));
   assert.equal(state.groups.filter(g=>g.error).length,1);assert.ok(state.groups.some(g=>g.label.toLowerCase().includes('sáč')));
   assert.ok(state.groups.every(g=>!g.label.includes('BASE')&&!g.label.includes('Q2')),'Report excludes unrelated regions/periods');
   await page.locator('.app-read-details > summary').click();calls=[];fail=false;
   await page.locator('.app-read-details > button').click();
   await page.waitForFunction(()=>!RPT_VIEW.pharmaLoading && !appReadSummary(appReadView()).error && !appReadSummary(appReadView()).pending);
   assert.deepEqual(calls.map(u=>u.searchParams.get('produkt')).sort(),['AFLcrm','AFLsach','AFLtbl','SUP']);
   assert.ok(calls.every(u=>u.searchParams.get('fresh')==='1'&&u.searchParams.get('oblast')===regions[i]&&u.searchParams.get('kvartal')==='2603'),'Header retry verifies only the current report on the server');
   await page.waitForFunction(()=>document.querySelector('[data-read-check]').dataset.readStatus==='verified');
   assert.equal(await page.locator('.app-read-details .app-read-sections').innerText().then(t=>/Nepodarilo|Zatiaľ neoverené/.test(t)),false,'Recovered forms actually turn green');
   if(i===0){
    failOverview=true;overviewCalls=[];await page.locator('.app-read-details > button').click();
    await page.waitForFunction(()=>!RP2_OV.loading && !RPT_VIEW.pharmaLoading && !appReadSummary(appReadView()).pending && appReadSummary(appReadView()).error);
    assert.equal(overviewCalls.length,2,'Benchmark overview has a bounded automatic retry');
    assert.equal(await page.evaluate(()=>appReadSummary(appReadView()).groups.filter(g=>g.error).length),1,'A failed benchmark stays visible while market products are verified');
    failOverview=false;overviewCalls=[];await page.locator('.app-read-details > button').click();
    await page.waitForFunction(()=>!RP2_OV.loading && !RPT_VIEW.pharmaLoading && !appReadSummary(appReadView()).pending && !appReadSummary(appReadView()).error);
    assert.equal(overviewCalls.length,1);assert.equal(overviewCalls[0].searchParams.get('fresh'),'1');
    // Return to an already loaded region without losing its verification rows.
    await page.evaluate(()=>{USERS_LOCAL.rep.region='NR';rptViewEnsurePharma(RP2_LAST.m);});
    await page.waitForFunction(()=>!RPT_VIEW.pharmaLoading);const before=calls.length;
    await page.evaluate(region=>{USERS_LOCAL.rep.region=region;rptViewEnsurePharma(RP2_LAST.m);appReadRefreshVisible();},regions[i]);
    const warm=await page.evaluate(()=>appReadSummary(appReadView()));
    assert.equal(calls.length,before);assert.equal(warm.groups.filter(g=>g.label.includes(' · '+regions[i]+' · Q3')).length,4,'Warm returns retain all current form statuses');
   }
   const group=await page.evaluate(()=>{RPT_VIEW.scope='sk';appReadRefreshVisible();return appReadSummary(appReadView());});
   assert.ok(group.groups.every(g=>!g.label.startsWith('Trhové údaje')),'Group reports do not accumulate market rows');cases++;
  }
  await page.close();
 }
 assert.deepEqual(errors,[]);await browser.close();console.log(cases+' mobile/desktop report cases: two Aflamil forms, scoped status, real header retry and green recovery passed');
})().catch(e=>{console.error(e);process.exit(1);});
