const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.SATORI_PLAYWRIGHT||'playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));let invalid=false;
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname==='satori.test'){
   let file=u.pathname==='/'?'index.html':u.pathname.slice(1);
   if(!process.env.SATORI_TEST_BUILD && /^dist\/app\..*\.js$/.test(file))file='app.js';
   const target=path.resolve(root,file);if(!target.startsWith(root+path.sep)||!fs.existsSync(target))return route.abort();
   return route.fulfill({body:fs.readFileSync(target),contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':undefined});
  }
  if(u.hostname.includes('script.google'))return route.fulfill({json:invalid?{ok:false,error:'Synthetic refresh failure'}:{ok:true,rows:[],posts:[],events:[],reps:[],summary:[],okresy:[],plan:{},predaje:{}}});
  return route.abort();
 });
 await page.goto('https://satori.test/');await page.waitForFunction(()=>typeof appReadSummary==='function');
 const roles=['rep west','rep east','am west','am east','am','boss','bum','pm','admin','asistent'];
 for(const line of ['gp','gyn','reagila'])for(const role of (line==='gyn'?roles.concat(['gyn-rep','gyn-am','gyn-pm','gyn-bum','gyn-asistent']):line==='reagila'?roles.concat(['kam']):roles)){
  await page.evaluate(({line,role})=>{
   document.querySelectorAll('.show').forEach(e=>e.classList.remove('show'));APP_LINE_EPOCH++;
   getSession=()=>({username:'test-'+role,role,line,session_token:'synthetic'});IS_DEV=false;
   document.body.classList.remove('login-active');document.getElementById('login-screen').style.display='none';
   document.querySelector('.app').style.visibility='visible';
   document.body.classList.toggle('gyn-line',line==='gyn');document.body.classList.toggle('reagila-line',line==='reagila');
   document.body.classList.toggle('manager-mode',!/rep|kam/.test(role));_panelCurrent='sklady-overlay';
   document.getElementById('sklady-overlay').classList.add('show');document.getElementById('sklady-body').innerHTML='<div>Uložené zásoby</div>';
   appReadRefreshVisible();
  },{line,role});
  assert.match(await page.locator('[data-read-check]').innerText(),/Čas overenia.*nie je známy/);
  assert.equal(await page.locator('[data-read-check]').isVisible(),true);
  await page.evaluate(()=>appQueuedFetchJson(stockRequestUrl(),{cache:'no-store'},5000,'background'));
  await page.waitForFunction(()=>document.querySelector('.app-read-time')?.textContent.startsWith('Overené'));
  assert.match(await page.locator('#sklady-body').innerText(),/Uložené zásoby/);
 }
 console.log('36 line/role combinations including Gyn roles and KAM: scoped timestamps and cache preservation passed');
 const cases=[
  ['dnes-overlay','dnes-body','getStockData'],['nastenka-overlay','nst-list','getNastenka'],
  ['rep-plnenie-overlay','rep-pl-q-content','getPlnenieAll'],['team-plnenie-overlay','team-plnenie-body','getTeamPlnenie'],
  ['pharma-ms-overlay','pharma-ms-body','getPharmaData'],['lk-overlay','lk-list','getLekarne'],
  ['lk-detail','lk-detail-body','getLekarneDetail'],['okresy-overlay','okresy-list','getPharmaData'],
  ['lb-overlay','lb-body','getPlnenieAll'],['hist-overlay','hist-body','getHistory'],
  ['golem-cal-overlay','golem-cal-content','getCalEvents'],['tuyory-overlay','tuyory-body','getAllTuyory'],
  ['lonelix-overlay','lonelix-body','getAllLonelix'],['apixaban-overlay','apixaban-body','getAllApixaban']
 ];
 for(const [panel,host,action] of cases){
  const result=await page.evaluate(async({panel,host,action})=>{
   document.querySelectorAll('.show').forEach(e=>e.classList.remove('show'));APP_LINE_EPOCH++;
   getSession=()=>({username:'screen-'+panel,role:'admin',line:'gp',session_token:'synthetic'});
   document.body.classList.remove('gyn-line','reagila-line','mgr-plnenie-detail-open');
   LK_DETAIL_LOGIN='test-rep';PL_STATE.year=REP_PL_STATE.year=2026;PL_STATE.q=REP_PL_STATE.q=3;
   PHARMA_STATE.activeCode='aflamilkr';PHARMA_STATE.oblast='TN';PHARMA_STATE.kvartal='2603';
   let h=document.getElementById(host);if(!h){h=document.createElement('div');h.id=host;document.getElementById(panel).appendChild(h);}h.innerHTML='<div>Uložené údaje</div>';
   document.getElementById(panel).classList.add('show');_panelCurrent=panel;appReadRefreshVisible();
   const view=appReadView(),flat=Object.fromEntries(Object.entries(view.params).map(([k,v])=>[k,Array.isArray(v)?v[0]:v])),params=new URLSearchParams({action,...flat});
   const url=scriptUrl(params.toString());await appQueuedFetchJson(url,{cache:'no-store'},5000,'background');
   appReadRefreshVisible();return {key:view.key,last:appReadSummary(view).last,view};
  },{panel,host,action});
  assert.ok(result.last>0,panel+' must record successful check');
  assert.match(await page.locator('[data-read-check]').innerText(),/Overené/);
  await page.evaluate(host=>{document.getElementById(host).innerHTML='<div>Prekreslené údaje</div>';appReadRefreshVisible();},host);
  assert.equal(await page.locator('[data-read-check]').count(),1,'DOM redraw must retain exactly one status');
  invalid=true;
  await page.evaluate(async action=>{const view=appReadView(),flat=Object.fromEntries(Object.entries(view.params).map(([k,v])=>[k,Array.isArray(v)?v[0]:v]));await appQueuedFetchJson(scriptUrl(new URLSearchParams({action,...flat}).toString()),{cache:'no-store'},5000,'critical');appReadRefreshVisible();},action);
  assert.equal(await page.evaluate(()=>appReadSummary(appReadView()).last),result.last,'Failed refresh cannot advance check time');
  assert.match(await page.locator('#'+host).innerText(),/Prekreslené údaje/);
  invalid=false;
 }
 console.log('14 feature screens: persisted status after redraw and unchanged timestamp on failed refresh passed');
 for(const line of ['gp','gyn','reagila'])for(const tab of ['plnenie','leaderboard','kalendar','activity','reporty',...(line==='gyn'?['lekarne']:['visits'])]){
  const result=await page.evaluate(async({line,tab})=>{
   document.querySelectorAll('.show').forEach(e=>e.classList.remove('show'));APP_LINE_EPOCH++;
   getSession=()=>({username:'nav-'+line+'-'+tab,role:'bum',line,session_token:'synthetic'});
   document.body.classList.toggle('gyn-line',line==='gyn');document.body.classList.toggle('reagila-line',line==='reagila');document.body.classList.add('manager-mode');
   _panelCurrent=null;MGR_STATE.subtab=tab;GYN_APP.nav=tab;GYN_APP.detailLogin=null;
   if(line==='gyn'&&tab!=='reporty'){
    const shell=document.getElementById('gyn-view');shell.innerHTML='<div id="gyn-content">Uložené údaje</div>';shell.classList.add('show');
   }
   const view=appReadView();let host=document.querySelector(view.host);if(host)host.innerHTML='<div>Uložené údaje</div>';
   const action=view.actions.find(a=>a!=='getConfig'),flat=Object.fromEntries(Object.entries(view.params).map(([k,v])=>[k,Array.isArray(v)?v[0]:v]));
   await appQueuedFetchJson((line==='gyn'?gynScriptUrl:scriptUrl)(new URLSearchParams({action,...flat}).toString()),{cache:'no-store'},5000,'background');
   appReadRefreshVisible();return {view,last:appReadSummary(view).last};
  },{line,tab});
  assert.ok(result.last>0,line+' '+tab+' supports verification');
 }
 console.log('Manager/BUM and Gyn navigation: fulfilment, ranking, calendar, activity, reports, pharmacies and visits passed');
 await page.evaluate(async()=>{
  document.querySelectorAll('.show').forEach(e=>e.classList.remove('show'));document.body.classList.remove('gyn-line','reagila-line');
  getSession=()=>({username:'race-test',role:'admin',line:'gp'});APP_LINE_EPOCH++;
  document.getElementById('sklady-overlay').classList.add('show');_panelCurrent='sklady-overlay';
  const url=stockRequestUrl();let oldRelease,newRelease;
  const old=appTrackedRead(url,{},()=>new Promise(resolve=>oldRelease=resolve));
  const latest=appTrackedRead(url,{},()=>new Promise(resolve=>newRelease=resolve));
  newRelease({ok:true,rows:[]});await latest;const last=appReadSummary(appReadView()).last;
  oldRelease({ok:false,error:'Late old request'});await old;
  if(appReadSummary(appReadView()).last!==last||appReadSummary(appReadView()).error)throw new Error('Old response changed latest verification');
  const pending=appTrackedRead(url,{},()=>new Promise(resolve=>oldRelease=resolve));APP_LINE_EPOCH++;oldRelease({ok:true,rows:[]});await pending;
  if(appReadSummary(appReadView()).last!==last)throw new Error('Stale line epoch advanced verification');
 });
 console.log('Out-of-order responses and stale line epochs cannot overwrite successful verification');
 await page.screenshot({path:path.join(root,'.tmp-data-freshness-mobile.png')});
 assert.deepEqual(errors,[]);await page.unrouteAll({behavior:'ignoreErrors'});await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
