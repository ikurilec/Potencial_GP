const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.SATORI_PLAYWRIGHT||'playwright');const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let newPlans=false,offline=false;
 await page.addInitScript(()=>{
  const NativeDate=Date;let shift=NativeDate.UTC(2026,9,8,12)-NativeDate.now();
  window.testSetDate=iso=>{shift=new NativeDate(iso).getTime()-NativeDate.now()};
  window.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[NativeDate.now()+shift]));}static now(){return NativeDate.now()+shift;}};
 });
 function payload(q,line,year=2026){const key=line==='gyn'?'belara':line==='reagila'?'reagila':'cavinton';return {ok:true,planProducts:[key],predajeProducts:[key],plan:{'synthetic-user':{[key]:(year===2027||q===4&&!newPlans)?0:100}},predaje:{'synthetic-user':{total:{[key]:q===4?25:75},byMonth:{7:{[key]:25},8:{[key]:25},9:{[key]:25},10:{[key]:25}}}}};}
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());if(u.hostname==='satori.test'){
   let file=u.pathname==='/'?'index.html':u.pathname.slice(1);if(!process.env.SATORI_TEST_BUILD&&file.startsWith('dist/app.')&&file.endsWith('.js'))file='app.js';
   const target=path.resolve(root,file);if(!target.startsWith(root+path.sep)||!fs.existsSync(target))return route.abort();
   return route.fulfill({body:fs.readFileSync(target),contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':undefined});
  }
  if(u.searchParams.get('action')==='getPlnenieAll'){
   if(offline)return route.abort();const line=await page.evaluate(()=>getSession().line);return route.fulfill({json:payload(Number(u.searchParams.get('Q')),line,Number(u.searchParams.get('rok')))});
  }
  if(u.hostname.includes('script.google'))return route.fulfill({json:{ok:true,value:'',posts:[],events:[],users:[],data:[]}});return route.abort();
 });
 await page.goto('https://satori.test/');await page.waitForFunction(()=>typeof plneniePlansCheck==='function');
 for(const line of ['gp','gyn','reagila'])for(const role of ['rep','manager','admin']){
  newPlans=false;offline=false;
  await page.evaluate(({line,role,p3,p4})=>{
   closeAllPanels();APP_LINE_EPOCH++;localStorage.clear();PLNENIE_PLAN_PERIODS={};PLNENIE_PLAN_CHECKS={};IS_DEV=false;
   const r=line==='gyn'?(role==='rep'?'gyn-rep':role==='admin'?'admin':'gyn-manager'):(role==='rep'?'rep east':role==='admin'?'admin':'am east');
   window.testUser={line,role:r,username:'synthetic-user',name:'Testovací používateľ',region:'KE',linia:'pill',session_token:'synthetic'};getSession=()=>window.testUser;
   document.getElementById('login-screen').style.display='none';document.body.classList.remove('login-active','gyn-line','manager-mode');document.querySelector('.app').style.visibility='visible';
   usageSectionEnter=()=>{};appTabSyncFromTab=()=>{};satoriGuideQueueHint=()=>{};
   MGR_ALL=['synthetic-user'];MGR_AM_EAST=MGR_ALL;MGR_ROLE_CFG.admin.reps=MGR_ALL;MGR_ROLE_CFG.ameast.reps=MGR_ALL;
   MGR_STATE.role=role==='admin'?'admin':'ameast';MGR_STATE.subtab='visits';mgrDetectRole=()=>role==='rep'?null:role==='admin'?'admin':'ameast';
   Object.assign(PL_STATE,{year:2026,q:4,loaded:true,loading:false,detailRep:null,qCache:{3:{data:p3,aggregates:plnenieBuildAggregates(p3,3,MGR_ALL)},4:{data:p4,aggregates:plnenieBuildAggregates(p4,4,MGR_ALL)}}});
   Object.assign(REP_PL_STATE,{year:2026,q:4,loaded:true,loading:false,qCache:{3:{data:p3,aggregates:plnenieBuildAggregates(p3,3,MGR_ALL)},4:{data:p4,aggregates:plnenieBuildAggregates(p4,4,MGR_ALL)}}});
   Object.assign(GYN_APP,{year:2026,q:4,nav:'historia',plCache:{3:p3,4:p4},plLoading:{},_plReqIds:{},detailLogin:null});
   GYN_STATE.repList=[{login:'synthetic-user',meno:'Testovací používateľ',region:'KE',linia:'pill',role:'gyn-rep'}];GYN_LB.plCache={3:p3,4:p4};
   for(const q of [3,4]){
    const data=q===3?p3:p4;DataStore.set(_plRepLsKey('synthetic-user',2026,q),data);DataStore.set(_plLsKey(2026,q),data);
    gynCacheWrite(gynPlnenieCacheKey(2026,q),data);gynCacheWrite(gynPlnenieCacheKey(2026,q)+'|lb-fullLine',data);
   }
   if(line==='gyn'){gynRenderShell(testUser);gynNavTo('plnenie');}
   else if(role==='rep')openRepPlnenie();else {document.body.classList.add('manager-mode');mgrSwitchSubtab('plnenie');}
  },{line,role,p3:payload(3,line),p4:payload(4,line)});
  const selected=()=>page.evaluate(()=>getSession().line==='gyn'?GYN_APP.q:(mgrDetectRole(getSession())?PL_STATE.q:REP_PL_STATE.q));
  assert.equal(await selected(),3,line+'/'+role+': cached plans must open Q3 immediately');
  await page.waitForFunction(()=>Object.keys(PLNENIE_PLAN_CHECKS).length===0 && plneniePlanKnown()['2026:4']===false);
  assert.equal(await selected(),3,'Sales-only Q4 stays on Q3');
  assert.equal(await page.evaluate(()=>getSession().line==='gyn'?dnesPlnenieGyn().q:(mgrDetectRole(getSession())?dnesPlnenieTim().q:dnesPlnenie().q)),3,'Home fulfilment uses planned Q3');
  if(line!=='gyn')assert.equal(await page.evaluate(()=>dnesRebricekData().q),4,'Home leaderboard still uses calendar Q4');
  if(line!=='gyn'&&role!=='rep'){
   await page.evaluate(()=>{MGR_STATE.subtab='leaderboard';lbOpenRepDetail('synthetic-user')});
   assert.equal(await selected(),4,'Leaderboard drill-down preserves its own Q4');
   await page.evaluate(()=>{PL_STATE.detailRep=null;document.body.classList.remove('mgr-plnenie-detail-open');mgrSwitchSubtab('plnenie')});
   assert.equal(await selected(),3,'Explicit main fulfilment entry restores Q3');
  }
  assert.equal(await page.evaluate(()=>lbLastCompletedQ()),4);assert.equal(await page.evaluate(()=>teamPlnenieQuarter()),4);
  await page.evaluate(()=>plnenieRefreshPlansAndRerender());
  newPlans=true;await page.evaluate(()=>plnenieRefreshPlansAndRerender());assert.equal(await selected(),4,'New Q4 plans promote fulfilment');
  assert.equal(await page.evaluate(()=>getSession().line==='gyn'?dnesPlnenieGyn().q:(mgrDetectRole(getSession())?dnesPlnenieTim().q:dnesPlnenie().q)),4,'Home promotes to Q4 with plans');
  if(line!=='gyn')assert.equal(await page.evaluate(()=>mgrDetectRole(getSession())?PL_STATE.data.plan['synthetic-user'].cavinton||PL_STATE.data.plan['synthetic-user'].reagila:REP_PL_STATE.data.plan['synthetic-user'].cavinton||REP_PL_STATE.data.plan['synthetic-user'].reagila),100,'Promotion must show fresh plans');
  // Manual Q3 remains selected after a background check; explicit reopen resets to Q4.
  await page.evaluate(()=>{if(getSession().line==='gyn')gynSwitchQ(3);else if(mgrDetectRole(getSession()))plnenieSwitchQ(3);else repPlnenieSwitchQ(3)});
  await page.evaluate(()=>plnenieRefreshPlansAndRerender());assert.equal(await selected(),3,'Manual Q selection survives refresh');
  await page.evaluate(()=>{if(getSession().line==='gyn')gynNavTo('plnenie');else if(mgrDetectRole(getSession()))mgrSwitchSubtab('plnenie');else openRepPlnenie()});
  assert.equal(await selected(),4,'Reopening selects latest planned Q');
  await page.waitForFunction(()=>Object.keys(PLNENIE_PLAN_CHECKS).length===0);
  console.log(line+'/'+role+': cached Q3, sales-only Q4, plan promotion, manual selection and reopen passed');
 }
 await page.evaluate(()=>testSetDate('2027-01-05T12:00:00'));
 await page.evaluate(()=>plnenieRefreshPlansAndRerender());
 assert.deepEqual(await page.evaluate(()=>plnenieDefaultPeriod()),{q:4,year:2026},'Q1 without plans uses previous-year Q4');
 assert.equal(await page.evaluate(()=>lbLastCompletedQ()),1);assert.equal(await page.evaluate(()=>teamPlnenieYear()),2027);
 assert.equal(await page.evaluate(()=>plnenieMaxQ(2026)),4,'All previous-year quarters remain accessible');
 console.log('Year boundary: fulfilment Q4 2026, leaderboard Q1 and team year 2027 passed');
 assert.deepEqual(errors,[],'No browser JS errors');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
