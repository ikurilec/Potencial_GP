'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Ivan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const root=path.resolve(__dirname,'..'),browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});let cases=0;
try{for(const prefix of ['', 'nahlad/'])for(const line of ['gp','reagila']){
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[],market=[];let held=true,resolvers=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async r=>{const u=new URL(r.request().url());if(u.hostname==='satori.test'){let f=u.pathname.slice(1)||'index.html';if(process.env.SATORI_NAV_SOURCE&&/^(nahlad\/)?dist\/app\.[a-f0-9]+\.js$/.test(f))f=prefix+'app.js';return r.fulfill({path:path.resolve(root,f)});}if(u.hostname==='script.google.com'){
  const a=u.searchParams.get('action');if(a==='getPharmaData'){const area=u.searchParams.get('oblast');market.push(area);if(held)await new Promise(resolve=>resolvers.push(resolve));const name=area==='MI'?'Svidník':'Bratislava II';return r.fulfill({json:{ok:true,okresy:[{okres:name,nas_m1:10,nas_m2:12,nas_m3:15,nas_pat_m1:10,nas_pat_m2:12,nas_pat_m3:15,tot_pat_m1:100,tot_pat_m2:100,tot_pat_m3:100}],okresy_prev:[],summary:[]}});}
  return r.fulfill({json:{ok:true,value:'2026-10-23',rows:[],posts:[],events:[],plan:{},predaje:{},repList:[]}});
 }return r.abort();});
 await page.goto('https://satori.test/'+prefix+'index.html');await page.waitForFunction(()=>typeof gsOpen==='function');
 await page.evaluate(line=>{
  APP_LINE_EPOCH++;getSession=()=>({username:'manager',name:'Test manažér',role:'admin',line,session_token:'synthetic',device_id:'device'});IS_DEV=false;loginScreenSetExclusive(false);document.getElementById('login-screen').classList.remove('show');document.querySelector('.app').style.visibility='visible';document.body.classList.add('manager-mode','mgr-subtab-plnenie','app-nav');document.body.classList.toggle('reagila-line',line==='reagila');
  USERS_LOCAL.west={name:'Test BAMA',region:'BAMA',role:'rep west'};USERS_LOCAL.east={name:'Test MI',region:'MI',role:'rep east'};MGR_REP_NAMES.west='Test BAMA';MGR_REP_NAMES.east='Test MI';MGR_ALL=['west','east'];MGR_AM_WEST=['west'];MGR_AM_EAST=['east'];MGR_STATE.role='admin';MGR_STATE.subtab='plnenie';MGR_STATE.reps={west:{visits:[]},east:{visits:[]}};
  PL_STATE.q=3;PL_STATE.year=2026;PL_STATE.loaded=true;PL_STATE.data={ok:true,plan:{west:{cavinton:100},east:{cavinton:100}},predaje:{west:{cavinton:90},east:{cavinton:95}}};
  if(line==='reagila')reagilaApplyPharmaMaps_();else golemRestorePharmaMaps_();
  PHARMA_STATE.cache={};OKRESY_STATE.byCode={};okresyLoadCacheMeta=()=>null;_phLsLoadFresh=()=>null;
  gsApplyEnabled();gsOpen();
 },line);
 assert.equal(await page.locator('#gs-input').evaluate(e=>e===document.activeElement),false);
 await page.locator('#gs-input').tap();await page.locator('#gs-input').fill('svidnik');assert.match(await page.locator('.gs-row-top').innerText(),/Test MI/);assert.doesNotMatch(await page.locator('.gs-row-top').innerText(),/BAMA/);
 await page.locator('.gs-row-top').click();await page.waitForFunction(()=>PL_STATE.detailRep==='east'&&OKRESY_STATE.open&&OKRESY_STATE.oblast==='MI');
 await page.waitForTimeout(4100);assert.equal(await page.evaluate(()=>OKRESY_STATE.expandedName),'Svidník','The target survives beyond the former 3.5-second polling deadline');
 held=false;resolvers.splice(0).forEach(r=>r());await page.waitForSelector('#pl-detail-okresy-body .okr-item.open .okr-hdr-name');assert.equal(await page.locator('#pl-detail-okresy-body .okr-item.open .okr-hdr-name').innerText(),'Svidník');
 assert.ok(market.length>0);assert.ok(market.every(area=>area==='MI'),'All district market reads use the selected territory');assert.equal(await page.evaluate(()=>PL_STATE.detailRep),'east');
 await page.evaluate(()=>{MGR_STATE.role='amwest';gsOpen();});await page.locator('#gs-input').fill('svidnik');assert.equal(await page.evaluate(()=>GS.items.some(e=>e.type==='district'&&e.title==='Svidník')),false,'West cannot navigate into East working data');
 assert.deepEqual(errors,[]);await page.close();console.log((prefix||'live/')+line+': actual Svidník route chooses MI, survives slow data, expands the requested district and preserves AM scope');cases++;
}}finally{await browser.close();}console.log(cases+' real district navigation cases passed');})().catch(e=>{console.error(e);process.exitCode=1;});
