'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Ivan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});let count=0;
 try{for(const prefix of ['', 'nahlad/'])for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:850}});let release,network=0,boardNetwork=0;const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.hostname==='satori.test'){let f=u.pathname.slice(1)||'index.html';if(f.endsWith('/'))f+='index.html';const file=path.resolve(root,f);if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.abort();return route.fulfill({body:fs.readFileSync(file),contentType:f.endsWith('.js')?'application/javascript':f.endsWith('.css')?'text/css':'text/html'});}if(u.hostname==='script.google.com'&&u.searchParams.get('action')==='getCalEvents'){network++;await new Promise(r=>release=r);return route.fulfill({json:{ok:true,events:[]}});}if(u.hostname==='script.google.com'&&u.searchParams.get('action')==='getNastenka'){boardNetwork++;assert.equal(u.searchParams.get('fresh'),'1');return route.fulfill({json:{ok:true,posts:[]}});}return route.abort();});
  await page.goto('https://satori.test/'+prefix);await page.waitForFunction(()=>typeof appReadPendingVisible==='function');
  const roles={gp:['admin','boss','bum','am west','am east','rep west'],gyn:['admin','boss','bum','gyn-manager','gyn-am','gyn-rep'],reagila:['admin','boss','bum','am west','am east','kam']};
  for(const [line,list] of Object.entries(roles))for(const role of list){
   const before=network;
   await page.evaluate(async({line,role})=>{
    APP_LINE_EPOCH++;getSession=()=>({username:'synthetic',role,line,session_token:'synthetic-token',device_id:'device'});IS_DEV=false;APP_MANUAL_REFRESH_UNTIL=0;APP_READ_META={};APP_READ_REUSE={};APP_READ_CHECKS={};APP_READ_PRESENTATION={};
    document.querySelectorAll('.show').forEach(e=>e.classList.remove('show'));document.body.classList.remove('login-active','mgr-plnenie-detail-open');document.getElementById('login-screen').style.display='none';document.body.classList.toggle('gyn-line',line==='gyn');document.body.classList.toggle('reagila-line',line==='reagila');
    _panelCurrent='dnes-overlay';document.getElementById(_panelCurrent).classList.add('show');document.getElementById('dnes-body').innerHTML='<div class="dnes-card">Údaje z pamäte zostávajú zobrazené</div>';
    plnenieDefaultPeriod=()=>({year:2026,q:3});plnenieCalendarPeriod=()=>({year:2026,q:4});lbLastCompletedQ=gynLbLastCompletedQ=()=>4;dnesRefreshIfOpen=()=>{};MGR_STATE.subtab='idle';GYN_APP.nav='idle';GYN_CAL._syncing=false;GYN_CAL.events=[];GYN_CAL._everSyncedOk=true;
    for(const action of ['getNastenka','getStockData','getCalEvents','getPlnenieAll&rok=2026&Q=3','getPlnenieAll&rok=2026&Q=4','getHistory&reprezentant=synthetic']){const u=scriptUrl('action='+action);await appTrackedRead(u,{},()=>Promise.resolve(action.startsWith('getHistory')?[]:{ok:true,posts:[],rows:[],events:[],plan:{},predaje:{}}),'background');}
    appReadRefreshVisible();for(const r of Object.values(APP_READ_REUSE))if(APP_READ_META[Object.keys(APP_READ_REUSE).find(k=>APP_READ_REUSE[k]===r)]?.action==='getCalEvents')r.ts-=61000;
    gynCalLiveSync();
   },{line,role});
   await page.waitForFunction(()=>APP_REQUEST_QUEUE.running.some(j=>j.resource?.action==='getCalEvents'));
   const quiet=await page.evaluate(()=>{appReadRefreshVisible();document.querySelector('.app-read-details').open=true;const g=appReadHomeSummary(appReadView()).groups.find(g=>g.id==='calendar');return {pending:g.pending,current:g.current,loading:!!APP_READ_CHECKS[appReadView().key]?.pending,text:document.querySelector('[data-read-section="calendar"]').textContent};});
   assert.equal(quiet.pending,false);assert.equal(quiet.current,true);assert.equal(quiet.loading,false);assert.match(quiet.text,/Overené/);assert.doesNotMatch(quiet.text,/Overujem/);
   await page.evaluate(()=>{window.manualDone=false;gynCalSync('critical',true).then(()=>manualDone=true);appReadRefreshVisible();});
   await page.waitForFunction(()=>appReadHomeSummary(appReadView()).groups.find(g=>g.id==='calendar').pending);assert.equal(network,before+1,'Automatic and foreground checks share one server read');
   release();await page.waitForFunction(()=>manualDone&&!GYN_CAL._syncing&&APP_REQUEST_QUEUE.running.length===0);await page.evaluate(()=>appReadRefreshVisible());
   const settled=await page.evaluate(()=>{const s=appReadHomeSummary(appReadView());return s.groups.every(g=>!g.pending&&!g.error);});assert.equal(settled,true);assert.match(await page.locator('#dnes-body').innerText(),/Údaje z pamäte/);
   const boardBefore=boardNetwork;await page.evaluate(async()=>{for(let i=0;i<2;i++)await new Promise(resolve=>nstFetch(resolve,'critical',true));});assert.equal(boardNetwork,boardBefore+2,'Every Board opening reads the latest server data, including consecutive opens');count++;
  }
  assert.deepEqual(errors,[]);await page.close();console.log(prefix+' '+width+': 18 role/line cases passed');
 }}finally{await browser.close();}console.log(count+' built lifecycle cases passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
