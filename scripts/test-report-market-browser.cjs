const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require(process.env.SATORI_PLAYWRIGHT||'playwright'),root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});let fail=false,reads=[],chartReads=[],districtTest=false;const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());if(u.hostname==='satori.test'){
   let f=u.pathname==='/'?'index.html':u.pathname.slice(1);if(!process.env.SATORI_TEST_BUILD&&/^dist\/app\..*\.js$/.test(f))f='app.js';
   const p=path.resolve(root,f);if(!p.startsWith(root+path.sep)||!fs.existsSync(p))return route.abort();return route.fulfill({body:fs.readFileSync(p),contentType:f.endsWith('.js')?'application/javascript':f.endsWith('.css')?'text/css':f.endsWith('.html')?'text/html':undefined});
  }
  if(u.hostname.includes('script.google')){
   if(u.searchParams.get('action')==='getPharmaOkresGraf'){await new Promise(resolve=>chartReads.push({route,resolve}));return;}
   if(u.searchParams.get('action')==='getPharmaData'){reads.push(u);await new Promise(r=>setTimeout(r,80));return route.fulfill({json:fail?{ok:false,error:'test failure'}:{ok:true,summary:[],okresy:districtTest?[{okres:'Košice',nas_m1:10,nas_m2:12,nas_m3:15,k1:{name:'Konkurent',m1:20,m2:18,m3:16}}]:[]}});}
   return route.fulfill({json:{ok:true,posts:[],events:[],reps:[]}});
  }return route.abort();
 });
 await page.goto('https://satori.test/');await page.waitForFunction(()=>typeof rptViewEnsurePharma==='function');
 for(const line of ['gp','reagila'])for(const role of ['admin','boss','bum','pm','am west','am east']){
  reads=[];await page.evaluate(({line,role})=>{
   document.querySelectorAll('.show').forEach(e=>e.classList.remove('show'));APP_LINE_EPOCH++;
   getSession=()=>({username:'manager-'+role,line,role,session_token:'test'});IS_DEV=false;
   document.body.classList.remove('login-active','gyn-line','mgr-plnenie-detail-open');document.body.classList.add('manager-mode','mgr-subtab-reporty');document.getElementById('mgr-view').classList.add('show');document.body.classList.toggle('reagila-line',line==='reagila');MGR_STATE.subtab='reporty';
   document.getElementById('login-screen').style.display='none';document.querySelector('.app').style.visibility='visible';
   USERS_LOCAL.rep={region:'KE'};RPT_VIEW={scope:'rep',username:'rep',pharmaLoadedOblasts:{},pharmaWant:'all'};PHARMA_STATE.cache={};
   if(line==='reagila')reagilaApplyPharmaMaps_();else golemRestorePharmaMaps_();
   rptViewPeriod=()=>({year:2026,q:3,month:9});rptViewScopeReps=()=>['rep'];
   RP2_LAST.m={prods:(line==='gp'?['aflamil_kr','suprax','vidonorm']:['reagila','cavinton','dmf']).map(key=>({key,g100:10}))};
   const host=document.getElementById('mgr-reporty-view');host.innerHTML='<div id="test-market"></div>';host.classList.add('show');host.style.display='block';
   rp2Schedule=()=>{document.getElementById('test-market').innerHTML=rptViewPharmaStatusHtml()||'<div>Trhové dáta načítané</div>';};
   rptViewEnsurePharma(RP2_LAST.m);rp2Schedule();
  },{line,role});
  await page.waitForFunction(()=>!RPT_VIEW.pharmaLoading);assert.equal(reads.length,3,line+'/'+role+' must fetch mapped market products');
  assert.deepEqual(reads.map(u=>u.searchParams.get('produkt')).sort(),(line==='gp'?['AFLcrm','SUP','VID']:['Reagila','Cavinton','DMF']).sort());
  assert.match(await page.locator('#test-market').innerText(),/načítané/);
  assert.equal(await page.evaluate(()=>Object.keys(PHARMA_STATE.loading).length),0);
 }
 fail=true;await page.evaluate(()=>rptViewRefreshPharma());await page.waitForFunction(()=>!RPT_VIEW.pharmaLoading);assert.match(await page.locator('#test-market').innerText(),/nepodarilo/);assert.equal(await page.locator('#test-market .rp2-spin').count(),0);
 const retryStyle=await page.locator('#test-market button').evaluate(el=>{const s=getComputedStyle(el);return {height:el.getBoundingClientRect().height,radius:parseFloat(s.borderRadius),color:s.color,font:s.fontFamily};});
 assert.ok(retryStyle.height>=44);assert.ok(retryStyle.radius>=18);assert.equal(retryStyle.color,'rgb(255, 255, 255)');assert.match(retryStyle.font,/Outfit/);
 fail=false;await page.locator('#test-market button').click();await page.waitForFunction(()=>!RPT_VIEW.pharmaLoading);assert.match(await page.locator('#test-market').innerText(),/načítané/);

 await page.evaluate(()=>{
  document.querySelectorAll('.show').forEach(e=>e.classList.remove('show'));APP_LINE_EPOCH++;
  getSession=()=>({username:'chart-manager',line:'gp',role:'admin',session_token:'test'});document.body.classList.remove('reagila-line');
  PHARMA_STATE.activeCode='A';PHARMA_STATE.oblast='KE';PHARMA_STATE.kvartal='2603';openPharmaOkresChart({okres:'Košice'},'Produkt A');
 });
 await page.waitForFunction(()=>APP_REQUEST_QUEUE.running.some(j=>j.url.includes('getPharmaOkresGraf')));
 for(let i=0;i<50&&chartReads.length<1;i++)await new Promise(r=>setTimeout(r,20));assert.equal(chartReads.length,1);
 await page.evaluate(()=>{PHARMA_STATE.activeCode='B';openPharmaOkresChart({okres:'Košice'},'Produkt B');});
 for(let i=0;i<50&&chartReads.length<2;i++)await new Promise(r=>setTimeout(r,20));assert.equal(chartReads.length,2);
 const chartPayload={ok:true,rows:[{mesiac:'2608',nas_ms:40,komp:[]},{mesiac:'2609',nas_ms:42,komp:[]}]};
 await chartReads[1].route.fulfill({json:chartPayload});chartReads[1].resolve();
 await page.waitForFunction(()=>document.getElementById('pharma-okres-legend').textContent.includes('Produkt B'));
 await chartReads[0].route.fulfill({json:chartPayload});chartReads[0].resolve();await page.waitForTimeout(150);
 assert.match(await page.locator('#pharma-okres-legend').innerText(),/Produkt B/);
 await page.evaluate(()=>{PHARMA_STATE.activeCode='C';openPharmaOkresChart({okres:'Košice'},'Produkt C');});
 for(let i=0;i<50&&chartReads.length<3;i++)await new Promise(r=>setTimeout(r,20));assert.equal(chartReads.length,3);
 await page.evaluate(()=>{closePharmaOkresChart();openPharmaOkresChart({okres:'Košice'},'Produkt C');});
 await chartReads[2].route.fulfill({json:chartPayload});chartReads[2].resolve();
 await page.waitForFunction(()=>document.getElementById('pharma-okres-legend').textContent.includes('Produkt C'));

 districtTest=true;
 await page.evaluate(()=>{
  closePharmaOkresChart();_panelCurrent='okresy-overlay';document.getElementById('okresy-overlay').classList.add('show');
  Object.assign(OKRESY_STATE,{ctx:'rep',containerId:'okresy-list',reqId:100,oblast:'KE',kvartal:'2603',byCode:{},expandedName:null,detail:null});
  okresyCodes=()=>['A','B'];okresyLoadAll(100,'latest',document.getElementById('okresy-list'),true,true);
 });
 await page.waitForFunction(()=>!OKRESY_STATE._loadBatch);assert.match(await page.locator('#okresy-list').innerText(),/Košice/);
 fail=true;await page.evaluate(()=>okresyLoadAll(100,'new-version',document.getElementById('okresy-list'),false,true));
 await page.waitForFunction(()=>!OKRESY_STATE._loadBatch);assert.match(await page.locator('#okresy-list').innerText(),/Košice/);assert.match(await page.locator('#okresy-list').innerText(),/Obnova niektorých údajov zlyhala/);
 assert.equal(await page.evaluate(()=>OKRESY_STATE._cacheVer),'latest');
 assert.deepEqual(errors,[]);await browser.close();console.log('12 manager/line report combinations, Reagila product mapping, visible completion, failed refresh and retry passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
