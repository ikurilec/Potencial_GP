const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require(process.env.SATORI_PLAYWRIGHT||'playwright');const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async r=>{
  const u=new URL(r.request().url());
  if(u.hostname==='satori.test'){
   let file=u.pathname==='/'?'index.html':u.pathname.slice(1);if(!process.env.SATORI_TEST_BUILD&&/^dist\/app\..*\.js$/.test(file))file='app.js';
   const p=path.resolve(root,file);if(!p.startsWith(root+path.sep)||!fs.existsSync(p))return r.abort();return r.fulfill({body:fs.readFileSync(p),contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html'});
  }
  if(u.hostname.includes('script.google'))return r.fulfill({json:{ok:true,value:'test',summary:[],okresy:[{okres:u.searchParams.get('oblast')+' okres',nas_m1:12}],plan:{},predaje:{},rows:[],posts:[],events:[]}});
  return r.abort();
 });
 await page.goto('https://satori.test/');await page.waitForFunction(()=>typeof okresyLoadAll==='function');
 for(const line of ['gp','reagila'])for(const role of ['admin','am west','am east','am','boss','bum','pm']){
  await page.evaluate(async({line,role})=>{
   APP_LINE_EPOCH++;getSession=()=>({username:'test-'+role,role,line,session_token:'synthetic'});IS_DEV=false;
   document.querySelectorAll('.show').forEach(e=>e.classList.remove('show'));document.body.classList.remove('login-active');document.body.classList.add('manager-mode','mgr-plnenie-detail-open');MGR_STATE.subtab='plnenie';_panelCurrent=null;
   PL_STATE.detailRep='colleague';USERS_LOCAL.colleague={region:'KE',role:'rep east'};
   ['predaje','lekarne','okresy'].forEach(n=>{let el=document.getElementById('pl-detail-'+n);if(!el){el=document.createElement('div');el.id='pl-detail-'+n;document.body.appendChild(el);}el.style.display=n==='okresy'?'':'none';});
   let body=document.getElementById('pl-detail-okresy-body');if(!body){body=document.createElement('div');body.id='pl-detail-okresy-body';document.getElementById('pl-detail-okresy').appendChild(body);}
   okresyCodes=()=>['VID','SUP','CAV'];okresyOpen('mgr','pl-detail-okresy-body');
  },{line,role});
  await page.waitForFunction(()=>OKRESY_STATE._loadBatch===null && Object.keys(OKRESY_STATE.byCode).length===3);
  const view=await page.evaluate(()=>appReadView());assert.equal(view.type,'mgr-detail-okresy');assert.equal(view.params.oblast,'KE');
  assert.match(await page.locator('#pl-detail-okresy-body').innerText(),/KE okres/);
  assert.equal(await page.evaluate(()=>appQueuePriority({prio:'critical',resource:appReadResource(pharmaDataRequestUrl('VID','KE',OKRESY_STATE.kvartal,true,true))})),2);
  await page.evaluate(()=>{USERS_LOCAL.colleague.region='TN';okresyOpen('mgr','pl-detail-okresy-body');});
  await page.waitForFunction(()=>OKRESY_STATE._loadBatch===null && Object.keys(OKRESY_STATE.byCode).length===3);
  assert.match(await page.locator('#pl-detail-okresy-body').innerText(),/TN okres/);assert.doesNotMatch(await page.locator('#pl-detail-okresy-body').innerText(),/KE okres/);
 }
 for(const line of ['gp','gyn','reagila'])for(const role of ['rep west','admin','am','boss','bum']){
  await page.evaluate(async({line,role})=>{
   APP_LINE_EPOCH++;getSession=()=>({username:'home-'+role,role,line,session_token:'synthetic'});document.querySelectorAll('.show').forEach(e=>e.classList.remove('show'));document.getElementById('dnes-overlay').classList.add('show');_panelCurrent='dnes-overlay';
   let pendingResolve;const url=scriptUrl('action=getStockData');let p=appTrackedRead(url,{},()=>new Promise(r=>pendingResolve=r),'background');
   if(APP_READ_CHECKS[appReadView().key]?.pending)throw Error('Background preload restarted Home spinner');pendingResolve({ok:true,rows:[]});await p;
   p=appTrackedRead(url,{},()=>new Promise(r=>pendingResolve=r),'critical');if(!APP_READ_CHECKS[appReadView().key]?.pending)throw Error('Explicit refresh has no progress');pendingResolve({ok:true,rows:[]});await p;
  },{line,role});
 }
 assert.deepEqual(errors,[]);await browser.close();console.log('14 manager scope/load combinations and 15 Home line/role combinations passed');
})().catch(e=>{console.error(e);process.exit(1)});
