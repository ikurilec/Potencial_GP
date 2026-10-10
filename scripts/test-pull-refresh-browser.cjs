const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require(process.env.SATORI_PLAYWRIGHT||'playwright');const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true});
 for(const device of ['Android','iPhone']){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:device==='Android'?'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36':'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));let refreshes=0;
  await page.route('**/*',async route=>{
   const u=new URL(route.request().url());if(u.hostname==='satori.test'){
    let f=u.pathname==='/'?'index.html':u.pathname.slice(1);if(!process.env.SATORI_TEST_BUILD&&/^dist\/app\..*\.js$/.test(f))f='app.js';if(!process.env.SATORI_TEST_BUILD&&/^dist\/app\..*\.css$/.test(f))f='app.css';
    const p=path.resolve(root,f);if(!p.startsWith(root+path.sep)||!fs.existsSync(p))return route.abort();return route.fulfill({body:fs.readFileSync(p),contentType:f.endsWith('.js')?'application/javascript':f.endsWith('.css')?'text/css':f.endsWith('.html')?'text/html':undefined});
   }
   if(u.hostname.includes('script.google')){
    if(u.searchParams.get('action')==='getStockData'&&u.searchParams.has('fresh'))refreshes++;
    return route.fulfill({json:{ok:true,rows:[],posts:[],events:[],reps:[],plan:{},predaje:{}}});
   }return route.abort();
  });
  await page.goto('https://satori.test/');await page.waitForFunction(()=>typeof appAttachOverlayPtr==='function');
  await page.evaluate(()=>{window.__touchLog=[];['touchstart','touchmove','touchend','touchcancel'].forEach(t=>document.addEventListener(t,e=>__touchLog.push({type:t,cancel:e.cancelable,prevented:e.defaultPrevented,owner:!!APP_PTR_OWNER,busy:Object.keys(APP_PTR_BUSY),scroll:document.getElementById('sklady-overlay').scrollTop}),{capture:true}));});
  const cdp=await context.newCDPSession(page);
  async function pull(distance=150,horizontal=0,cancel=false){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:190,y:145}]});
   for(const factor of [.02,.07,.18,.4,.7,1]){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:190+horizontal*factor,y:145+distance*factor}]});await page.waitForTimeout(18);}
   await cdp.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});
  }
  async function setup(line,role){await page.evaluate(({line,role})=>{
   document.querySelectorAll('.show').forEach(e=>e.classList.remove('show'));APP_LINE_EPOCH++;
   getSession=()=>({username:'test',role,line,session_token:'synthetic'});IS_DEV=false;
   document.body.classList.remove('login-active','gyn-line','manager-mode','reagila-line');document.getElementById('login-screen').style.display='none';
   _panelCurrent='sklady-overlay';const ov=document.getElementById('sklady-overlay');ov.classList.add('show');ov.scrollTop=0;
   document.getElementById('sklady-body').innerHTML='<div style="height:1300px">Uložené údaje skladu</div>';
   stockForceRefresh=done=>appQueuedFetchJson(stockRequestUrl(),{cache:'no-store'},5000,'critical').then(done,done);
  },{line,role});await page.waitForTimeout(300);}
  for(const line of ['gp','gyn','reagila'])for(const role of ['rep west','am west','boss','bum','admin','asistent']){
   await setup(line,line==='gyn'?({'rep west':'gyn-rep','am west':'gyn-am',boss:'gyn-pm',bum:'gyn-bum',asistent:'gyn-asistent'}[role]||role):role);
   const before=refreshes;await pull();await page.waitForFunction(()=>!document.querySelector('.app-ptr.loading'),{},{timeout:8000});
   assert.equal(refreshes,before+1,device+'/'+line+'/'+role+' trusted downward gesture must refresh exactly once '+JSON.stringify(await page.evaluate(()=>__touchLog.slice(-10))));
  }
  await setup('gp','rep west');let before=refreshes;await pull(45);await page.waitForTimeout(150);assert.equal(refreshes,before,'Short pull does not refresh');
  await pull(150,0,true);await page.waitForTimeout(150);assert.equal(refreshes,before,'Cancelled pull does not refresh');
  await page.evaluate(()=>document.getElementById('sklady-overlay').scrollTop=100);await pull();await page.waitForTimeout(150);assert.equal(refreshes,before,'A scrolled panel does not refresh');
  await setup('gp','rep west');await page.evaluate(()=>document.getElementById('confirm-overlay').classList.add('show'));await pull();assert.equal(refreshes,before,'Dialog blocks background refresh');
  await setup('gp','rep west');await pull(10,150);await page.waitForTimeout(800);assert.equal(refreshes,before,'Horizontal gesture does not refresh');
  // Exercise actual registered gesture handlers on panels that were missing PTR.
  // Loader behavior is checked independently; here retain fixtures to inspect the ring.
  const panels=[['team-plnenie-overlay','team-plnenie-body','team'],['golem-cal-overlay','golem-cal-content','calendar'],['lk-detail','lk-detail-body','pharmacy-detail'],['pharma-ms-overlay','pharma-ms-body','market'],['rep-plnenie-overlay','rep-pl-q-content','sales'],['dnes-overlay','dnes-body','home']];
  for(const [panel,host,type] of panels){
   await page.evaluate(({panel,host})=>{
    document.querySelectorAll('.show').forEach(e=>e.classList.remove('show'));APP_LINE_EPOCH++;
    getSession=()=>({username:'panel-test',role:'rep west',session_token:'synthetic'});_panelCurrent=panel;
    document.body.classList.remove('manager-mode','gyn-line','reagila-line');
    const ov=document.getElementById(panel);ov.classList.add('show');ov.scrollTop=0;
    let h=document.getElementById(host);if(!h){h=document.createElement('div');h.id=host;ov.appendChild(h);}h.innerHTML='<div style="height:1300px">Dáta obrazovky</div>';
    window.__ptrSelected=[];appPtrRefreshCurrent=done=>{__ptrSelected.push(appPtrViewType(appReadView()));setTimeout(done,180);return true;};
   },{panel,host});await page.waitForTimeout(300);await pull();
   await page.waitForFunction(()=>window.__ptrSelected.length===1,{},{timeout:4000}).catch(async e=>{throw Error(panel+' '+JSON.stringify(await page.evaluate(()=>({view:appReadView(),top:document.elementFromPoint(190,145)?.outerHTML.slice(0,160),events:__touchLog.slice(-10)}))));});
   assert.deepEqual(await page.evaluate(()=>__ptrSelected),[type]);
   await page.waitForFunction(()=>!document.querySelector('.app-ptr.loading'));
  }
  for(const [line,tab,type] of [['gp','plnenie','mgr-plnenie'],['gp','kalendar','mgr-kalendar'],['gp','activity','mgr-activity'],['gp','reporty','mgr-reporty'],['gyn','plnenie','gyn-plnenie'],['gyn','kalendar','gyn-kalendar'],['gyn','lekarne','gyn-lekarne']]){
   await page.evaluate(({line,tab})=>{
    document.querySelectorAll('.show').forEach(e=>e.classList.remove('show'));APP_LINE_EPOCH++;
    getSession=()=>({username:'manager-test',role:line==='gyn'?'gyn-am':'bum',line,session_token:'synthetic'});_panelCurrent=null;
    document.body.classList.toggle('gyn-line',line==='gyn');document.body.classList.toggle('manager-mode',line==='gp');
    document.querySelector('.app').style.display='';MGR_STATE.subtab=tab;GYN_APP.nav=tab;GYN_APP.detailLogin=null;
    const shell=document.getElementById(line==='gyn'?'gyn-view':'mgr-view');shell.innerHTML=line==='gyn'?'<div id="gyn-content" style="height:1300px">Dáta</div>':'<div id="pl-q-content" style="height:1300px">Dáta</div><div id="mgr-cal-content"></div><div id="act-body"></div><div id="mgr-reporty-view"></div>';
    shell.style.display='block';shell.classList.add('show');window.scrollTo(0,0);
    const view=appReadView();document.querySelector(view.host).style.minHeight='1300px';
    window.__ptrSelected=[];appPtrRefreshCurrent=done=>{__ptrSelected.push(appPtrViewType(appReadView()));setTimeout(done,180);return true;};
   },{line,tab});await page.waitForTimeout(300);await pull();await page.waitForFunction(()=>__ptrSelected.length===1,{},{timeout:4000}).catch(async()=>{throw Error(line+'/'+tab+' '+JSON.stringify(await page.evaluate(()=>({view:appReadView(),top:document.elementFromPoint(190,145)?.outerHTML.slice(0,120),scroll:document.scrollingElement.scrollTop,events:__touchLog.slice(-8)}))));});
   assert.deepEqual(await page.evaluate(()=>__ptrSelected),[type]);await page.waitForFunction(()=>!document.querySelector('.app-ptr.loading'));
  }
  assert.deepEqual(errors,[]);console.log(device+': 18 line/role trusted touch sequences, fresh requests, short/cancelled/scrolled/horizontal pulls and dialog guards passed');
  console.log(device+': team, calendar, pharmacy detail, market, sales and Home handlers select exactly the visible panel');
  console.log(device+': manager and Gyn document-scrolling fulfillment, calendar, activity, reports and pharmacy handlers passed');
  await context.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
