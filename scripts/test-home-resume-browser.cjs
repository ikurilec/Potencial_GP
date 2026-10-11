const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.SATORI_PLAYWRIGHT||'playwright'),root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[],calls=[];
 let failedAction='',holdAction='',release;
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname==='satori.test'){
   let f=u.pathname==='/'?'index.html':u.pathname.slice(1);if(!process.env.SATORI_TEST_BUILD&&/^dist\/app\..*\.js$/.test(f))f='app.js';
   const p=path.resolve(root,f);if(!p.startsWith(root+path.sep)||!fs.existsSync(p))return route.abort();
   return route.fulfill({body:fs.readFileSync(p),contentType:f.endsWith('.js')?'application/javascript':f.endsWith('.css')?'text/css':'text/html'});
  }
  if(!u.hostname.includes('script.google'))return route.abort();
  const action=u.searchParams.get('action');calls.push({action,q:u.searchParams.get('Q'),owner:u.searchParams.get('username')});
  if(action===holdAction)await new Promise(r=>release=r);else await new Promise(r=>setTimeout(r,35));
  let data={ok:true,rows:[],posts:[],events:[],reps:[],data:[],value:'',stats:{},overrides:{}};
  if(action==='getPlnenieAll')data={ok:true,plan:u.searchParams.get('Q')==='3'?{'test-user':{cavinton:100}}:{},predaje:{'test-user':{total:{cavinton:50},byMonth:{9:{cavinton:50}}}}};
  if(action==='getHistory')data=[];
  if(action===failedAction)data={ok:false,error:'Synthetic outage'};
  return route.fulfill({json:data});
 });
 await page.goto('https://satori.test/');await page.waitForFunction(()=>typeof appHomeResume==='function');
 const roles={gp:['admin','boss','bum','am west','am east','am','rep west'],gyn:['admin','boss','bum','gyn-manager','gyn-am','asistent','gyn-rep'],reagila:['admin','boss','bum','am west','am east','am','kam']};
 for(const line of Object.keys(roles))for(const role of roles[line]){
  await page.evaluate(({line,role})=>{
   APP_LINE_EPOCH++;getSession=()=>({username:'test-user',name:'Test User',role,line,session_token:'synthetic'});IS_DEV=false;
   document.querySelectorAll('.show').forEach(el=>el.classList.remove('show'));document.body.classList.remove('login-active','mgr-plnenie-detail-open');
   document.getElementById('login-screen').style.display='none';document.querySelector('.app').style.visibility='visible';
   document.body.classList.toggle('manager-mode',!/rep|kam/.test(role));document.body.classList.toggle('gyn-line',line==='gyn');document.body.classList.toggle('reagila-line',line==='reagila');
   _panelCurrent='dnes-overlay';document.getElementById(_panelCurrent).classList.add('show');
   document.getElementById('dnes-body').innerHTML='<div class="dnes-card">Údaje z pamäte</div>';
   dnesRefreshIfOpen=()=>{};MGR_STATE.subtab='idle';GYN_APP.nav='idle';
   PL_STATE.q=REP_PL_STATE.q=GYN_APP.q=3;PL_STATE.year=REP_PL_STATE.year=GYN_APP.year=2026;
   PL_STATE._planDefaultAuto=REP_PL_STATE._planDefaultAuto=GYN_APP._planDefaultAuto=true;
   PL_STATE.loaded=REP_PL_STATE.loaded=true;PL_STATE.loading=REP_PL_STATE.loading=REP_PL_STATE._currentLoading=false;
   PL_STATE.data=REP_PL_STATE.data={ok:true,plan:{'test-user':{cavinton:100}},predaje:{}};PL_STATE.qCache=REP_PL_STATE.qCache={};
   PLNENIE_PLAN_PERIODS[plneniePlanScope()]={'2026:4':false,'2026:3':true};PLNENIE_PLAN_RECENT={};
   GYN_CAL._syncing=false;NST.loading=false;GYN_LB.plLoading={};GYN_LB.dataReady={};LB_PLNENIE_LOADING=false;
   APP_READ_META={};APP_READ_GENERATIONS={};APP_READ_CHECKS={};APP_HOME_CHECK_STARTED={};
   const base=line==='gyn'?gynScriptUrl:scriptUrl,old=Date.now()-86400000;
   for(const query of ['getPlnenieAll&rok=2026&Q=3','getPlnenieAll&rok=2026&Q=4','getStockData','getCalEvents','getNastenka','getHistory&reprezentant=test-user']){
    const r=appReadResource(base('action='+query));r.visible=true;appReadRemember(r,old,false);
   }
   appReadRefreshVisible();appCheckHome();
  },{line,role});
  await page.waitForFunction(()=>{const s=appReadHomeSummary(appReadView());return s.groups.every(g=>!g.pending&&!g.error&&g.last>Date.now()-60000);},{timeout:15000});
  await page.evaluate(()=>appReadRefreshVisible());
  assert.match(await page.locator('.app-read-time').innerText(),/dnes/);assert.doesNotMatch(await page.locator('.app-read-time').innerText(),/včera/);
  assert.match(await page.locator('#dnes-body').innerText(),/Údaje z pamäte/);
  await page.waitForFunction(()=>APP_REQUEST_QUEUE.items.length===0&&APP_REQUEST_QUEUE.running.length===0,{timeout:10000});
 }
 console.log('21 real Home checks across all three lines, manager roles and representatives: current Q3, calendar Q4 ranking and cache preservation passed');
 await page.locator('.app-read-details summary').click();
 failedAction='getStockData';await page.evaluate(()=>{appStartManualRefresh();appCheckHome();});
 await page.waitForFunction(()=>appReadHomeSummary(appReadView()).groups.find(g=>g.id==='stocks').error,{timeout:10000});
 await page.waitForFunction(()=>document.querySelector('.app-read-sections').textContent.includes('Nepodarilo sa obnoviť'));
 assert.match(await page.locator('.app-read-sections').innerText(),/Sklady[\s\S]*Nepodarilo sa obnoviť/);
 assert.match(await page.locator('#dnes-body').innerText(),/Údaje z pamäte/);
 failedAction='';await page.locator('.app-read-details .app-err-btn').click();
 await page.waitForFunction(()=>appReadHomeSummary(appReadView()).groups.every(g=>!g.pending&&!g.error),{timeout:10000});
 assert.equal(await page.locator('.app-read-details').evaluate(e=>e.open),true,'Details remain expanded during updates');
 await page.waitForFunction(()=>APP_REQUEST_QUEUE.items.length===0&&APP_REQUEST_QUEUE.running.length===0,{timeout:10000});
 const start=calls.length;holdAction='getStockData';
 await page.evaluate(()=>{APP_HOME_CHECK_STARTED={};window.dispatchEvent(new Event('pageshow'));window.dispatchEvent(new Event('pageshow'));});
 await page.waitForFunction(()=>appReadHomeSummary(appReadView()).groups.find(g=>g.id==='stocks').pending);
 await page.waitForTimeout(150);assert.match(await page.locator('.app-read-sections').innerText(),/Sklady[\s\S]*Overujem/);
 assert.equal(calls.slice(start).filter(c=>c.action==='getStockData').length,1,'Duplicate pageshow must share one verification');
 holdAction='';release();await page.waitForFunction(()=>appReadHomeSummary(appReadView()).groups.every(g=>!g.pending&&!g.error),{timeout:10000});
 await page.setViewportSize({width:320,height:700});
 assert.equal(await page.locator('[data-read-check]').evaluate(e=>e.scrollWidth<=e.clientWidth+1),true,'Status remains within a small mobile viewport');
 await page.screenshot({path:path.join(root,'.tmp-home-check-details.png')});assert.deepEqual(errors,[]);
 await page.unrouteAll({behavior:'ignoreErrors'});await browser.close();console.log('Partial failure, explicit retry, preserved details, resume deduplication, pending section and 320px layout passed');
})().catch(e=>{console.error(e);process.exit(1);});
