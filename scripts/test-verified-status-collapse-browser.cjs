'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.SATORI_PLAYWRIGHT||'C:/Users/Ivan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),browser=await chromium.launch({headless:true,executablePath:process.env.SATORI_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});let cases=0;
 try{for(const prefix of ['', 'nahlad/'])for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.hostname!=='satori.test')return route.abort();let f=u.pathname.slice(1)||'index.html';if(f.endsWith('/'))f+='index.html';const p=path.resolve(root,f);if(!p.startsWith(root+path.sep)||!fs.existsSync(p))return route.abort();return route.fulfill({body:fs.readFileSync(p),contentType:f.endsWith('.js')?'application/javascript':f.endsWith('.css')?'text/css':'text/html'});});
  await page.goto('https://satori.test/'+prefix);await page.waitForFunction(()=>typeof appReadCollapseEligible==='function');
  for(const line of ['gp','gyn','reagila'])for(const role of ['admin','boss','bum','am west','am east','rep west','gyn-rep','kam']){
   await page.evaluate(({line,role,realTiming})=>{
    APP_LINE_EPOCH++;getSession=()=>({username:'collapse-synthetic',name:'Test User',role,line,session_token:'synthetic'});IS_DEV=false;
    document.querySelectorAll('.show').forEach(e=>e.classList.remove('show'));document.querySelectorAll('[data-read-check],[data-cached-content]').forEach(e=>e.remove());
    document.body.className='';document.getElementById('login-screen').style.display='none';const app=document.querySelector('.app');app.style.visibility='visible';app.style.display='block';
    const rep=/^(rep|gyn-rep|kam)/.test(role);document.body.classList.toggle('manager-mode',!rep);document.body.classList.toggle('gyn-line',line==='gyn');document.body.classList.toggle('reagila-line',line==='reagila');
    APP_READ_META={};APP_READ_CHECKS={};APP_READ_REUSE={};APP_READ_PRESENTATION={};APP_REQUEST_QUEUE.items=[];APP_REQUEST_QUEUE.running=[];APP_MANUAL_REFRESH_UNTIL=0;APP_READ_SUCCESS_HOLD_MS=realTiming?2000:30;
    PL_STATE.q=REP_PL_STATE.q=GYN_APP.q=3;PL_STATE.year=REP_PL_STATE.year=GYN_APP.year=2026;MGR_STATE.subtab='plnenie';GYN_APP.nav='plnenie';GYN_APP.detailLogin=null;_panelCurrent=null;
    if(line==='gyn'){document.getElementById('gyn-view').classList.add('show');app.style.display='none';}
    else if(rep){_panelCurrent='rep-plnenie-overlay';document.getElementById(_panelCurrent).classList.add('show');}
    else document.body.classList.add('mgr-subtab-plnenie');
    const view=appReadView();let host=document.querySelector(view.host);if(!host){host=document.createElement('div');host.id=view.host.slice(1);document.getElementById('gyn-view').appendChild(host);}host.innerHTML='<div class="dnes-card" data-cached-content>Overené plnenie</div>';
    window.salesReadResources=[];
    for(const action of view.actions.filter(a=>a!=='getConfig')){
     const params=Object.fromEntries(Object.entries(view.params).map(([k,v])=>[k,Array.isArray(v)?v[0]:v]));
     const r=appReadResource(view.path+'?'+new URLSearchParams({action,...params}));r.visible=true;r.reuseVersion=appReadVersion(r.action);appReadRemember(r,Date.now(),false);salesReadResources.push(r);
    }
    const old=appReadResource(view.path+'?action=getConfig&key=notif_predaje');old.reuseVersion=appReadVersion(old.action);appReadRemember(old,Date.now()-86400000,false);APP_READ_META[old.key].instance='previous-run';
    appReadRefreshVisible();
   },{line,role,realTiming:cases===0});
   const indicator=page.locator('[data-read-check]');assert.equal(await indicator.count(),1);assert.equal(await indicator.getAttribute('data-read-status'),'verified');
   if(cases===0){const before=await indicator.evaluate(e=>({height:e.getBoundingClientRect().height,next:e.nextElementSibling.getBoundingClientRect().top}));assert.ok(before.height>40);await page.waitForTimeout(900);assert.ok(await indicator.evaluate(e=>e.getBoundingClientRect().height)>40);await page.waitForFunction(()=>document.querySelector('[data-read-check]').classList.contains('app-read-collapsed'));assert.ok(await indicator.evaluate(e=>e.getAnimations().some(a=>a.transitionProperty==='height')));await page.waitForTimeout(340);assert.ok((await indicator.evaluate(e=>e.nextElementSibling.getBoundingClientRect().top))<before.next-35);}
   else {await page.waitForFunction(()=>document.querySelector('[data-read-check]').classList.contains('app-read-collapsed'));await page.waitForTimeout(360);}
   assert.ok(await indicator.evaluate(e=>e.getBoundingClientRect().height<1),line+' '+role+' completed sales status collapses');assert.equal(await indicator.getAttribute('aria-hidden'),'true');assert.equal(await page.locator('[data-cached-content]').innerText(),'Overené plnenie');
   await page.evaluate(()=>{window.finishSales=appReadBegin(appReadView(),salesReadResources[0]);});await page.waitForTimeout(320);assert.equal(await indicator.getAttribute('data-read-status'),'pending');assert.ok(await indicator.evaluate(e=>e.getBoundingClientRect().height)>40);
   await page.evaluate(()=>{appReadRemember(salesReadResources[0],Date.now(),true);finishSales(true);});await page.waitForTimeout(350);assert.equal(await indicator.getAttribute('data-read-status'),'error');assert.ok(await indicator.evaluate(e=>e.getBoundingClientRect().height)>40);assert.ok(await indicator.locator('button').first().isVisible());cases++;
  }
  assert.deepEqual(errors,[]);await page.close();console.log((prefix||'live/')+' '+width+': 24 actual sales views collapse; loading and failure remain visible');
 }}finally{await browser.close();}console.log(cases+' built sales verification cases passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
