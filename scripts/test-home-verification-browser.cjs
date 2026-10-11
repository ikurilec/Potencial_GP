const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.SATORI_PLAYWRIGHT||'playwright'),root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));let fail=false,slowStock=false;
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname==='satori.test'){
   let file=u.pathname==='/'?'index.html':u.pathname.slice(1);if(!process.env.SATORI_TEST_BUILD&&/^dist\/app\..*\.js$/.test(file))file='app.js';
   const p=path.resolve(root,file);if(!p.startsWith(root+path.sep)||!fs.existsSync(p))return route.abort();
   return route.fulfill({body:fs.readFileSync(p),contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html'});
  }
  if(!u.hostname.includes('script.google'))return route.abort();
  if(slowStock&&u.searchParams.get('action')==='getStockData')await new Promise(r=>setTimeout(r,14000));
  return route.fulfill({json:fail?{ok:false,error:'Synthetic server failure'}:{ok:true,rows:[],events:[],posts:[],plan:{},predaje:{},summary:[],okresy:[]}});
 });
 await page.goto('https://satori.test/');await page.waitForFunction(()=>typeof appReadBegin==='function');
 async function setup(line,role,panel){
  return page.evaluate(({line,role,panel})=>{
   APP_LINE_EPOCH++;getSession=()=>({username:'verify-'+role,role,line,session_token:'synthetic'});
   document.querySelectorAll('.show').forEach(el=>el.classList.remove('show'));document.body.classList.remove('login-active','mgr-plnenie-detail-open');
   document.body.classList.toggle('manager-mode',!['rep west','gyn-rep','kam'].includes(role));document.body.classList.toggle('gyn-line',line==='gyn');document.body.classList.toggle('reagila-line',line==='reagila');
   PL_STATE.q=REP_PL_STATE.q=GYN_APP.q=plnenieDefaultPeriod().q;PL_STATE.year=REP_PL_STATE.year=GYN_APP.year=plnenieDefaultPeriod().year;
   PHARMA_STATE.activeCode='CAV';PHARMA_STATE.oblast='KE';PHARMA_STATE.kvartal='2603';
   GYN_PHARMA_STATE.produkt='Belara';GYN_PHARMA_STATE.oblast='KE';GYN_PHARMA_STATE.kvartal='2603';
   LK_STATE.login='colleague';_panelCurrent=panel;document.getElementById(panel).classList.add('show');
   const v=appReadView(),host=document.querySelector(v.host);host.innerHTML='<div>Uložené údaje</div>';appReadRefreshVisible();return v;
  },{line,role,panel});
 }
 const panels=[['dnes-overlay','getStockData'],['sklady-overlay','getStockData'],['golem-cal-overlay','getCalEvents'],['rep-plnenie-overlay','getPlnenieAll'],['lk-overlay','getLekarne'],['pharma-ms-overlay','getPharmaData']];
 let count=0;
 const roles={gp:['admin','boss','bum','am west','am east','am','rep west'],gyn:['admin','boss','bum','gyn-manager','gyn-am','asistent','gyn-rep'],reagila:['admin','boss','bum','am west','am east','am','kam']};
 for(const line of ['gp','gyn','reagila'])for(const role of roles[line])for(const [panel,action] of panels){
  const view=await setup(line,role,panel),url=await page.evaluate(action=>{
   const v=appReadView(),p=Object.fromEntries(Object.entries(v.params).map(([k,v])=>[k,Array.isArray(v)?v[0]:v]));
   return (appLineTag()==='gyn'?gynScriptUrl:scriptUrl)(new URLSearchParams({action,...p}).toString());
  },action);
  fail=true;await page.evaluate(async url=>{await appQueuedFetchJson(url,{cache:'no-store'},12000,'critical');appReadRefreshVisible();},url);
  assert.match(await page.locator('[data-read-check]').innerText(),/Obnova zlyhala/,line+' '+role+' '+panel);
  fail=false;await page.evaluate(async url=>{await appQueuedFetchJson(url,{cache:'no-store'},12000,'background');appReadRefreshVisible();},url);
  assert.equal(await page.locator('[data-read-check] .nst-spin').count(),0);
  assert.doesNotMatch(await page.locator('[data-read-check]').innerText(),/Obnova zlyhala/);
  if(panel==='dnes-overlay')assert.ok(await page.evaluate(()=>appReadHomeSummary(appReadView()).groups.find(g=>g.id==='stocks').last)>0,'The recovered stock section has its own successful check; it does not verify every Home section');
  else assert.match(await page.locator('[data-read-check]').innerText(),/Overené/);
  assert.match(await page.locator(view.host).innerText(),/Uložené údaje/);count++;
 }
 await setup('gp','admin','dnes-overlay');slowStock=true;
 const cold=page.evaluate(async()=>{await appQueuedFetchJson(scriptUrl('action=getStockData'),{cache:'no-store'},12000,'critical');appReadRefreshVisible();});
 await page.waitForTimeout(12500);
 assert.equal(await page.locator('[data-read-check] .nst-spin').count(),1,'A normal 14-second server reply must not fail at the old 12-second limit');
 await cold;assert.ok(await page.evaluate(()=>appReadHomeSummary(appReadView()).groups.find(g=>g.id==='stocks').last)>Date.now()-30000);assert.equal(await page.locator('[data-read-check] .nst-spin').count(),0);
 assert.deepEqual(errors,[]);await page.unrouteAll({behavior:'ignoreErrors'});await browser.close();
 console.log(count+' screen/role/line failure-and-recovery cases and a real 14-second cold Home response passed');
})().catch(e=>{console.error(e);process.exit(1);});
