const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.SATORI_PLAYWRIGHT||'playwright'),root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());if(u.hostname!=='satori.test')return route.abort();
  let file=u.pathname==='/'?'index.html':u.pathname.slice(1);
  if(!process.env.SATORI_TEST_BUILD&&/^dist\/app\..*\.(js|css)$/.test(file))file=file.endsWith('.js')?'app.js':'app.css';
  const p=path.resolve(root,file);if(!p.startsWith(root+path.sep)||!fs.existsSync(p))return route.abort();
  return route.fulfill({body:fs.readFileSync(p),contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html'});
 });
 await page.goto('https://satori.test/');await page.waitForFunction(()=>typeof appReadSectionSummary==='function');
 const roles={gp:['admin','boss','bum','am west','am east','am','rep west'],gyn:['admin','boss','bum','gyn-manager','gyn-am','asistent','gyn-rep'],reagila:['admin','boss','bum','am west','am east','am','kam']};
 const overlays=['sklady-overlay','nastenka-overlay','rep-plnenie-overlay','team-plnenie-overlay','pharma-ms-overlay','lk-overlay','lk-detail','okresy-overlay','lb-overlay','hist-overlay','golem-cal-overlay','tuyory-overlay','lonelix-overlay','apixaban-overlay','pl-prod-sheet','pharma-okres-overlay','gs-overlay'];
 let cases=0;
 for(const line of Object.keys(roles))for(const role of roles[line]){
  const views=overlays.concat(/rep|kam/.test(role)?[]:(line==='gyn'?['gyn-plnenie','gyn-reporty','gyn-activity','gyn-kalendar','gyn-leaderboard','gyn-lekarne']:['mgr-plnenie','mgr-reporty','mgr-activity','mgr-kalendar','mgr-leaderboard','mgr-visits','mgr-detail-lekarne','mgr-detail-okresy']));
  for(const screen of views){
   const result=await page.evaluate(async({line,role,screen})=>{
    APP_LINE_EPOCH++;getSession=()=>({username:'status-test',role,line,session_token:'synthetic'});IS_DEV=false;
    document.querySelectorAll('.show').forEach(e=>e.classList.remove('show'));document.body.classList.remove('login-active','mgr-plnenie-detail-open');
    document.getElementById('login-screen').style.display='none';document.querySelector('.app').style.visibility='visible';
    document.body.classList.toggle('manager-mode',!/rep|kam/.test(role));document.body.classList.toggle('gyn-line',line==='gyn');document.body.classList.toggle('reagila-line',line==='reagila');
    APP_READ_META={};APP_READ_CHECKS={};APP_READ_REUSE={};APP_MANUAL_REFRESH_UNTIL=0;
    PL_STATE.q=REP_PL_STATE.q=GYN_APP.q=3;PL_STATE.year=REP_PL_STATE.year=GYN_APP.year=2026;PL_STATE.detailRep='colleague';GYN_APP.detailLogin=null;
    LK_DETAIL_LOGIN=LK_STATE.login=GYN_LK.login='colleague';PHARMA_STATE.activeCode='CAV';GYN_PHARMA_STATE.produkt='Belara';
    PHARMA_STATE.oblast=GYN_PHARMA_STATE.oblast=OKRESY_STATE.oblast='KE';PHARMA_STATE.kvartal=GYN_PHARMA_STATE.kvartal=OKRESY_STATE.kvartal='2603';
    PHARMA_OKRES_STATE.current={code:'CAV',oblast:'KE',r:{okres:'Košice'}};
    if(screen.startsWith('mgr-')){
     MGR_STATE.subtab=screen.slice(4);MGR_STATE.currentRep=null;
     if(screen.startsWith('mgr-detail-')){MGR_STATE.subtab='plnenie';document.body.classList.add('mgr-plnenie-detail-open');document.getElementById('pl-detail-lekarne').style.display=screen.endsWith('lekarne')?'block':'none';document.getElementById('pl-detail-okresy').style.display=screen.endsWith('okresy')?'block':'none';}
    }else if(screen.startsWith('gyn-')){GYN_APP.nav=screen.slice(4);document.getElementById('gyn-view').classList.add('show');}
    else{_panelCurrent=screen;document.getElementById(screen).classList.add('show');}
    const view=appReadView();if(!view||!view.actions.length)throw Error('Missing data view: '+screen);
    let host=document.querySelector(view.host);if(!host){host=document.createElement('div');host.id=view.host.slice(1);(document.getElementById(screen)||document.getElementById(screen.startsWith('mgr-')?'mgr-view':'gyn-view')).appendChild(host);}host.innerHTML='<div>Údaje z pamäte</div>';
    appReadRefreshVisible();const unknown=document.querySelector('[data-read-check]').dataset.readStatus;
    const params=Object.fromEntries(Object.entries(view.params).map(([k,v])=>[k,Array.isArray(v)?v[0]:v]));
    const action=view.actions[0],url=(line==='gyn'?gynScriptUrl:scriptUrl)(new URLSearchParams({action,...params}).toString());
    const data=action==='getHistory'?[]:{ok:true,rows:[],events:[],posts:[],reps:[],summary:[],okresy:[],plan:{},predaje:{}};
    await appTrackedRead(url,{},()=>Promise.resolve(data),'critical');appReadRefreshVisible();
    let el=document.querySelector('[data-read-check]');el.querySelector('details').open=true;
    const detailsNode=el.querySelector('details'),retryNode=detailsNode.querySelector('button');
    const green={status:el.dataset.readStatus,color:getComputedStyle(el.querySelector('.app-read-section-verified')).color};
    APP_MANUAL_REFRESH_UNTIL=Date.now()+15000;let release;
    const pending=appTrackedRead(url,{},()=>new Promise(r=>release=r),'critical');
    el=document.querySelector('[data-read-check]');const spinner=el.querySelector('.nst-spin');
    for(let i=0;i<6;i++)appReadPaint(APP_READ_CHECKS[view.key]);
    const loading={status:el.dataset.readStatus,spinner:!!spinner,stable:el.querySelector('.nst-spin')===spinner,open:el.querySelector('details').open};
    release({ok:false,error:'Synthetic failure'});await pending;appReadRefreshVisible();
    el=document.querySelector('[data-read-check]');const red={status:el.dataset.readStatus,color:getComputedStyle(el.querySelector('.app-read-section-error')).color,oldDate:el.textContent.includes('Posledné úspešné overenie')};
    await appTrackedRead(url,{},()=>Promise.resolve(data),'critical');appReadRefreshVisible();
    el=document.querySelector('[data-read-check]');const recovered={status:el.dataset.readStatus,open:el.querySelector('details').open,cache:host.textContent==='Údaje z pamäte',count:document.querySelectorAll('[data-read-check]').length,stableControls:el.querySelector('details')===detailsNode&&detailsNode.querySelector('button')===retryNode};
    return {screen,type:view.type,unknown,green,loading,red,recovered};
   },{line,role,screen});
   assert.equal(result.unknown,'unknown',screen);assert.equal(result.green.status,'verified',screen);assert.equal(result.loading.status,'pending',screen);
   assert.equal(result.loading.spinner,true,screen);assert.equal(result.loading.stable,true,screen);assert.equal(result.loading.open,true,screen);
   assert.equal(result.red.status,'error',screen);assert.notEqual(result.green.color,result.red.color,screen);assert.equal(result.red.oldDate,true,screen);
   assert.deepEqual(result.recovered,{status:'verified',open:true,cache:true,count:1,stableControls:true},screen);cases++;
  }
 }
 await page.setViewportSize({width:320,height:700});await page.locator('.app-read-details').evaluate(e=>e.open=true);
 assert.equal(await page.locator('[data-read-check]').evaluate(e=>e.scrollWidth<=e.clientWidth+1),true,'Small viewport status fits');
 await page.screenshot({path:path.join(root,'.tmp-read-status-mobile.png')});assert.deepEqual(errors,[]);
 await page.unrouteAll({behavior:'ignoreErrors'});await browser.close();console.log(cases+' actual view/role/line status transitions, colors, pending animation identity, preserved details/cache, single indicator and 320px layout passed');
})().catch(e=>{console.error(e);process.exit(1);});
