'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Ivan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const root=path.resolve(__dirname,'..'),browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});let cases=0;
try{for(const prefix of ['', 'nahlad/'])for(const width of [320,390,1280]){
 const page=await browser.newPage({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='satori.test')return r.abort();let f=u.pathname.slice(1)||'index.html';if(process.env.SATORI_NAV_SOURCE&&/^(nahlad\/)?dist\/app\.[a-f0-9]+\.(js|css)$/.test(f))f=prefix+'app.'+f.split('.').at(-1);const p=path.resolve(root,f);return p.startsWith(root+path.sep)&&fs.existsSync(p)?r.fulfill({path:p}):r.abort();});
 await page.goto('https://satori.test/'+prefix+'index.html');await page.waitForFunction(()=>typeof gsOpen==='function');
 for(const line of ['gp','gyn','reagila'])for(const role of ['admin','boss','bum','am west','am east','rep west','gyn-rep','kam']){
  await page.evaluate(({line,role})=>{
   gsClose();document.querySelectorAll('.show').forEach(e=>e.classList.remove('show'));APP_LINE_EPOCH++;getSession=()=>({username:'rep',name:'Test používateľ',role,line,session_token:'synthetic'});IS_DEV=false;loginScreenSetExclusive(false);document.getElementById('login-screen').style.display='none';
   document.body.classList.toggle('gyn-line',line==='gyn');document.body.classList.toggle('reagila-line',line==='reagila');document.body.classList.toggle('manager-mode',line!=='gyn'&&!/^(rep|kam)/.test(role));document.body.classList.add('app-nav');
   MGR_STATE.role=mgrDetectRole(getSession());MGR_STATE.reps={rep:{visits:[]}};MGR_ALL=['rep'];MGR_AM_WEST=['rep'];MGR_AM_EAST=['rep'];MGR_REP_NAMES.rep='Kolega Reprezentant';plnenieGetActiveReps=()=>['rep'];
   GYN_STATE.repList=[{login:'rep',meno:'Kolega Reprezentant',region:'BAPI',linia:'pill'}];GYN_LB.repList=GYN_STATE.repList;TEAM_PL_STATE.payload={reps:[{username:'rep',name:'Kolega Reprezentant',role:'rep west'}]};
   LK_STATE.cache={};LK_STATE._rows=[];GYN_LK.cache={};GS_DATA={owner:'',pharmacies:{},history:{},pending:0,failed:0};NST.posts=[];gsApplyEnabled();
   const launcher=document.getElementById('gs-launcher');launcher.focus();gsOpen();
  },{line,role});
  assert.equal(await page.locator('.gs-shortcuts .gs-shortcut').count(),6,'A compact opening view has six main routes');
  assert.equal(await page.locator('#gs-title').innerText(),'Hľadať v Satori');assert.match(await page.locator('#gs-line').innerText(),new RegExp(line==='gp'?'Golem':line==='gyn'?'Gynekológia':'Reagila'));
  assert.equal(await page.locator('#gs-input').evaluate(e=>e===document.activeElement),true);assert.equal(await page.evaluate(()=>appReadView()),null,'Search owns its inline loading state');
  await page.evaluate(()=>appReadRefreshVisible());assert.equal(await page.locator('#gs-results [data-read-check]').count(),0);
  const expanded=await page.locator('#gs-all-toggle').getAttribute('aria-expanded');assert.equal(expanded,'false');await page.locator('#gs-all-toggle').click();assert.equal(await page.locator('#gs-all-toggle').getAttribute('aria-expanded'),'true');assert.ok(await page.locator('.gs-functions .gs-row').count()>0);
  await page.locator('#gs-input').fill('sklady');assert.match(await page.locator('.gs-row-top').innerText(),/Sklady/);assert.ok(await page.locator('#gs-clear svg').isVisible());
  await page.locator('#gs-clear').click();assert.equal(await page.locator('#gs-input').inputValue(),'');assert.equal(await page.locator('#gs-input').evaluate(e=>e===document.activeElement),true);
  if(role==='admin'){
   await page.evaluate(()=>{for(let n=0;n<4;n++){const e={type:'district',title:'Test okres '+n,sub:'Okres',_n:'test okres '+n,_k:'test okres '+n,run(){}};GS.items.push(e);gsPushRecent(e);}localStorage.setItem('gs_recent_v1_unrelated_other','preserve');gsRender();});
   assert.equal(await page.locator('.gs-list .gs-row').count(),3,'Recents are capped at three');await page.locator('.gs-text-btn').click();assert.equal(await page.locator('.gs-list').count(),0);assert.equal(await page.locator('#gs-input').evaluate(e=>e===document.activeElement),true);assert.equal(await page.evaluate(()=>localStorage.getItem('gs_recent_v1_unrelated_other')),'preserve');
  }
  await page.evaluate(()=>{GS_DATA.pending=1;gsRender();});assert.match(await page.locator('.gs-data-status').innerText(),/Dopĺňam/);await page.evaluate(()=>{GS_DATA.pending=0;GS_DATA.failed=1;gsRender();});assert.ok(await page.locator('.gs-data-status button').isVisible());
  await page.evaluate(()=>{GS_DATA.failed=0;gsRender();});
  assert.ok(await page.locator('#gs-input').evaluate(e=>e.getBoundingClientRect().height>=44));assert.ok(await page.locator('.gs-esc').evaluate(e=>e.getBoundingClientRect().height>=44));
  assert.equal(await page.locator('.gs-modal').evaluate(e=>e.scrollWidth<=e.clientWidth+1),true);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.evaluate(()=>{const controls=Array.from(document.querySelectorAll('#gs-overlay input,#gs-overlay button')).filter(e=>!e.disabled&&!e.hidden&&e.getClientRects().length);controls.at(-1).focus();});await page.keyboard.press('Tab');assert.equal(await page.locator('.gs-esc').evaluate(e=>e===document.activeElement),true,'Tab remains inside dialog');
  await page.keyboard.press('Escape');assert.equal(await page.locator('#gs-overlay').isVisible(),false);assert.equal(await page.locator('#gs-launcher').evaluate(e=>e===document.activeElement),true,'Close returns focus');cases++;
 }
 await page.evaluate(()=>gsOpen());await page.waitForTimeout(250);await page.screenshot({path:path.join(root,'.tmp/navigator-'+(prefix?'preview':'live')+'-'+width+'.png')});
 await page.setViewportSize({width,height:360});await page.evaluate(()=>gsViewport());await page.waitForTimeout(100);assert.ok(await page.locator('.gs-modal').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight+1),'Dialog fits the keyboard-sized viewport');assert.ok(await page.locator('#gs-input').isVisible());
 assert.deepEqual(errors,[]);await page.close();console.log((prefix||'live/')+' '+width+': 24 role/line navigator UI cases passed');
}}finally{await browser.close();}console.log(cases+' navigator UI cases passed');})().catch(e=>{console.error(e);process.exitCode=1;});
