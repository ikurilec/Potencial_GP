const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.SATORI_PLAYWRIGHT||'playwright'),root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());if(u.hostname!=='satori.test')return route.abort();
  let f=u.pathname==='/'?'index.html':u.pathname.slice(1);
  if(!process.env.SATORI_TEST_BUILD&&/^dist\/app\..*\.(js|css)$/.test(f))f=f.endsWith('.js')?'app.js':'app.css';
  const p=path.resolve(root,f);if(!p.startsWith(root+path.sep)||!fs.existsSync(p))return route.abort();
  return route.fulfill({body:fs.readFileSync(p),contentType:f.endsWith('.js')?'application/javascript':f.endsWith('.css')?'text/css':'text/html'});
 });
 await page.goto('https://satori.test/');await page.waitForFunction(()=>typeof appReadRefreshVisible==='function');
 async function setup(line='gp',role='admin',screen='sklady-overlay'){
  await page.evaluate(({line,role,screen})=>{
   APP_LINE_EPOCH++;getSession=()=>({username:'collapse-test',name:'Test User',role,line,session_token:'synthetic'});IS_DEV=false;
   document.querySelectorAll('.show').forEach(e=>e.classList.remove('show'));document.body.classList.remove('login-active','mgr-plnenie-detail-open');
   document.getElementById('login-screen').style.display='none';document.querySelector('.app').style.visibility='visible';
   document.body.classList.toggle('manager-mode',!/rep|kam/.test(role));document.body.classList.toggle('gyn-line',line==='gyn');document.body.classList.toggle('reagila-line',line==='reagila');
   APP_READ_META={};APP_READ_CHECKS={};APP_READ_REUSE={};APP_MANUAL_REFRESH_UNTIL=0;
   _panelCurrent=screen;document.getElementById(screen).classList.add('show');
   PL_STATE.q=REP_PL_STATE.q=GYN_APP.q=3;PL_STATE.year=REP_PL_STATE.year=GYN_APP.year=2026;
   PHARMA_STATE.activeCode='CAV';GYN_PHARMA_STATE.produkt='Belara';PHARMA_STATE.oblast=GYN_PHARMA_STATE.oblast='KE';PHARMA_STATE.kvartal=GYN_PHARMA_STATE.kvartal='2603';
   const v=appReadView();let host=document.querySelector(v.host);
   if(!host){host=document.createElement('div');host.id=v.host.slice(1);document.getElementById(screen).appendChild(host);}
   host.innerHTML='<div class="dnes-card" data-cached-content>Údaje z pamäte</div>';
   window.testEntry={view:v,ctx:appLineCapture(),pending:0,error:false};
   window.testSuccess=()=>{
    const v=appReadView(),params=Object.fromEntries(Object.entries(v.params).map(([k,value])=>[k,Array.isArray(value)?value[0]:value]));
    const url=(appLineTag()==='gyn'?gynScriptUrl:scriptUrl)(new URLSearchParams({action:v.actions[0],...params}).toString());
    const resource=appReadResource(url);resource.visible=true;resource.reuseVersion=APP_READ_REUSE_VERSION;appReadRemember(resource,Date.now(),false);appReadRefreshVisible();
   };
   appReadRefreshVisible();
  },{line,role,screen});
 }
 const indicator=page.locator('[data-read-check]');
 await setup();await page.evaluate(()=>testSuccess());
 const before=await indicator.evaluate(e=>({height:e.getBoundingClientRect().height,next:e.nextElementSibling.getBoundingClientRect().top}));
 assert.ok(before.height>40,'Success remains visible long enough to read');assert.equal(await indicator.getAttribute('data-read-status'),'verified');
 await page.waitForTimeout(900);assert.ok(await indicator.evaluate(e=>e.getBoundingClientRect().height)>40,'Success hold is not an immediate disappearance');
 await page.waitForFunction(()=>document.querySelector('[data-read-check]')?.classList.contains('app-read-collapsed'));
 assert.equal(await indicator.evaluate(e=>e.getAnimations().some(a=>a.transitionProperty==='height')),true,'Collapse animates the actual height');
 await page.waitForTimeout(340);
 assert.equal(await indicator.evaluate(e=>e.getBoundingClientRect().height<1),true,'Successful status should collapse and free layout space');
 assert.equal(await indicator.getAttribute('aria-hidden'),'true');
 assert.ok((await indicator.evaluate(e=>e.nextElementSibling.getBoundingClientRect().top))<before.next-35,'Content moves upward after success');
 assert.equal(await page.locator('[data-cached-content]').innerText(),'Údaje z pamäte');
 await page.evaluate(()=>{for(let i=0;i<8;i++)appReadRefreshVisible();});
 assert.equal(await indicator.evaluate(e=>e.getBoundingClientRect().height<1),true,'Repeated paints keep successful status dismissed');
 await page.evaluate(()=>{document.querySelector('[data-read-check]').remove();appReadRefreshVisible();});
 assert.equal(await indicator.evaluate(e=>e.getBoundingClientRect().height<1),true,'Redraw must not flash the same successful check');
 await page.evaluate(()=>{window.endRead=appReadBegin(appReadView());});
 assert.equal(await indicator.getAttribute('aria-hidden'),null,'New refresh restores accessibility');
 await page.waitForTimeout(320);assert.ok(await indicator.evaluate(e=>e.getBoundingClientRect().height)>40);
 assert.equal(await indicator.getAttribute('data-read-status'),'pending');
 const stable=await page.evaluate(()=>{const el=document.querySelector('[data-read-check]'),spin=el.querySelector('.nst-spin');for(let i=0;i<5;i++)appReadPaint(APP_READ_CHECKS[appReadView().key]);return spin===el.querySelector('.nst-spin');});assert.equal(stable,true);
 await page.evaluate(()=>endRead(true));await page.waitForTimeout(2200);
 assert.equal(await indicator.getAttribute('data-read-status'),'error');assert.ok(await indicator.evaluate(e=>e.getBoundingClientRect().height)>40,'Failed checks remain visible');
 assert.equal(await indicator.locator('button').first().isVisible(),true,'Retry remains reachable');
 await page.evaluate(()=>{APP_READ_CHECKS={};testSuccess();});await indicator.locator('summary').tap();
 assert.equal(await indicator.locator('details').evaluate(e=>e.open),true,'A finger tap opens the green details');
 await page.waitForTimeout(1800);assert.ok(await indicator.evaluate(e=>e.getBoundingClientRect().height)>100,'Expanded success stays readable for approximately two seconds');
 await page.waitForTimeout(900);assert.equal(await indicator.evaluate(e=>e.getBoundingClientRect().height<1),true,'All-green expanded details collapse as well');
 assert.equal(await indicator.locator('details').evaluate(e=>e.open),true,'Collapse preserves expanded state');
 await page.evaluate(()=>{window.endRead=appReadBegin(appReadView());});await page.waitForTimeout(320);
 assert.ok(await indicator.evaluate(e=>e.getBoundingClientRect().height)>100,'New refresh reveals expanded details');
 assert.equal(await indicator.getAttribute('data-read-status'),'pending');assert.equal(await indicator.locator('details').evaluate(e=>e.open),true);
 await page.evaluate(()=>endRead(true));await page.waitForTimeout(2600);
 assert.ok(await indicator.evaluate(e=>e.getBoundingClientRect().height)>100,'Expanded failed checks stay visible');
 await setup();await page.waitForTimeout(2200);assert.ok(await indicator.evaluate(e=>e.getBoundingClientRect().height)>40,'Unknown checks never hide');
 // Accelerate only the hold for the mapping matrix; the full timing/animation is checked above.
 await page.evaluate(()=>{APP_READ_SUCCESS_HOLD_MS=30;});
 const roles={gp:['admin','boss','bum','am west','am east','am','rep west'],gyn:['admin','boss','bum','gyn-manager','gyn-am','asistent','gyn-rep'],reagila:['admin','boss','bum','am west','am east','am','kam']};
 let cases=0;
 for(const line of Object.keys(roles))for(const role of roles[line])for(const screen of ['sklady-overlay','nastenka-overlay','pharma-ms-overlay']){
  await setup(line,role,screen);await page.evaluate(()=>{document.querySelector('.app-read-details').open=true;testSuccess();});await page.waitForTimeout(360);
  assert.equal(await indicator.evaluate(e=>e.getBoundingClientRect().height<1),true,line+' '+role+' '+screen);
  await page.evaluate(()=>{window.endRead=appReadBegin(appReadView());});await page.waitForTimeout(320);
  assert.ok(await indicator.evaluate(e=>e.getBoundingClientRect().height)>40,line+' '+role+' '+screen+': refresh reveals status');
  assert.equal(await indicator.getAttribute('data-read-status'),'pending');await page.evaluate(()=>endRead());cases++;
 }
 await page.emulateMedia({reducedMotion:'reduce'});await setup();await page.evaluate(()=>testSuccess());await page.waitForTimeout(80);
 assert.equal(await indicator.evaluate(e=>e.getBoundingClientRect().height<1),true,'Reduced-motion collapse');
 await page.setViewportSize({width:320,height:700});await page.evaluate(()=>{window.endRead=appReadBegin(appReadView());});
 assert.equal(await indicator.evaluate(e=>e.scrollWidth<=e.clientWidth+1),true,'320px loading layout fits');
 await page.screenshot({path:path.join(root,'.tmp-read-collapse-loading.png')});await page.evaluate(()=>endRead());
 assert.deepEqual(errors,[]);await page.unrouteAll({behavior:'ignoreErrors'});await browser.close();
 console.log('Success timing, upward layout collapse, redraw, pending restoration/spinner identity, failure/retry, details, unknown data, reduced motion and '+cases+' role/line/view cases passed');
})().catch(e=>{console.error(e);process.exit(1);});
