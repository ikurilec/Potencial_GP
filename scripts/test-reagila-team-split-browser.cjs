const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.SATORI_PLAYWRIGHT||'C:/Users/Ivan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),roster=[{login:'m.sibert',meno:'Michaela Sibert',region:'BA',tim:'west'},{login:'z.bernatova',meno:'Zuzana Bernátová',region:'SE',tim:'west'},{login:'l.hricova',meno:'Ľudmila Hricová',region:'ST',tim:'east'},{login:'p.papcun',meno:'Peter Papcun',region:'VY',tim:'east'}];
const roles=[['am west','h.madaraszova'],['am east','l.faber'],['admin','admin'],['boss','j.gavlak'],['bum','e.starostova'],['pm','v.dzurilla'],...roster.map(r=>['rep '+r.tim,r.login]),['am','legacy-am']];
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{for(const prefix of ['','nahlad/'])for(const width of [390,1280])for(const [role,username] of roles){
 const active=role!=='am',ownTeam=role==='am west'?'west':role==='am east'?'east':null,isManager=!role.startsWith('rep '),own=roster.find(r=>r.login===username),calls=[],context=await browser.newContext({viewport:{width,height:900},isMobile:width<600,hasTouch:width<600,serviceWorkers:'block'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const u=new URL(route.request().url());
  if(u.hostname==='satori.test'){let f=u.pathname.slice(1)||'index.html';const m=f.match(/^(nahlad\/)?dist\/app\.[a-f0-9]{8}\.(js|css)$/);if(m&&!process.env.SATORI_BUILT_TEST)f=(m[1]||'')+'app.'+m[2];const p=path.join(root,f);return fs.existsSync(p)?route.fulfill({path:p}):route.fulfill({status:404,body:''});}
  if(!u.hostname.includes('script.google'))return route.abort();const action=u.searchParams.get('action');calls.push(action);let data={ok:true,rows:[],posts:[],events:[],dohody:[],value:''};
  const visible=active&&!u.searchParams.has('fullLine')?(ownTeam?roster.filter(r=>r.tim===ownTeam):own?[own]:roster):roster;
  const reps=visible.map(r=>({...r,rola:active?'rep '+r.tim:'rep west'}));
  if(action==='getRepList')data={ok:true,reps,team_split_enabled:active};
  if(action==='getInitData')data={ok:true,repList:reps,history:[],team_split_enabled:active};
  if(action==='getPlnenieAll'){const plan={},predaje={};roster.forEach(r=>{plan[r.login]={reagila:100};predaje[r.login]={total:{reagila:70},byMonth:{10:{reagila:70}}};});data={ok:true,plan,predaje,planProducts:['reagila'],predajeProducts:['reagila']};}
  if(action==='getAllHistory'||action==='getLastLogins')data={};if(action==='getManagers')data=[{username:'h.madaraszova',name:'Hana Madarászová',role:'am west'},{username:'l.faber',name:'Lenka Fáber',role:active?'am east':'am'}];if(action==='getReps')data=reps.map(r=>r.login);
  return route.fulfill({json:data});
 });
 await page.goto('https://satori.test/'+prefix+'index.html');await page.waitForFunction(()=>typeof loginSuccess==='function');
 await page.evaluate(({role,username,active,region})=>{IS_DEV=false;localStorage.clear();sessionStorage.clear();LOGIN_REMEMBER_ME=false;satoriShouldShow=()=>false;wnShouldShow=()=>false;checkMilestone=()=>{};pushMaybePrompt=()=>{};nameDayCelebrate=()=>{};birthdayCelebrate=()=>{};loginSuccess(username,'Test '+username,role,region,{line:'reagila',team_split_enabled:active,tim:role==='am west'?'west':role==='am east'?'east':'',session_token:'synthetic',device_id:'fixture'});},{role,username,active,region:own?own.region:''});
 await page.waitForFunction(()=>REP_LIST_STATE.loaded && (typeof PL_STATE!=='undefined'&&PL_STATE.loaded || typeof REP_PL_STATE!=='undefined'&&REP_PL_STATE.loaded),{timeout:15000});
 const state=await page.evaluate(()=>({role:MGR_STATE.role,line:appLineTag(),active:reagilaTeamSplitEnabled(),classActive:document.body.classList.contains('reagila-team-split'),reps:MGR_ALL.slice(),work:plnenieGetActiveReps().slice(),scopes:rptViewAllowedScopes().map(x=>x[0]),cfg:(MGR_ROLE_CFG[MGR_STATE.role]||{}).reps||[],cap:getSession().reagila_team_split}));
 assert.equal(state.line,'reagila');assert.equal(state.active,active);assert.equal(state.classActive,active);assert.equal(state.cap,active);assert.ok(state.reps.every(u=>roster.some(r=>r.login===u)),'No stale Golem representative in Reagila');
 if(ownTeam){const expected=roster.filter(r=>r.tim===ownTeam).map(r=>r.login);assert.deepEqual(state.work,expected);assert.deepEqual(state.cfg,expected);assert.deepEqual(state.scopes,['rep',ownTeam]);assert.equal(calls.includes('getInitData'),false,'AM boot uses authorized roster, not a manager personal history');}
 else if(isManager){assert.equal(state.reps.length,4);assert.deepEqual(state.scopes,active?['rep','west','east','sk']:['rep','sk']);}
 else assert.equal(await page.evaluate(()=>getSession().username),username);
 if(isManager){const visible=await page.locator('.mgr-subtab[data-tab="reporty"]').evaluate(el=>getComputedStyle(el).display!=='none');assert.equal(visible,active,'Reports appear only with active split support');}
 if(active){await page.evaluate(()=>reagilaEnsureComparisonRoster());assert.equal(await page.evaluate(()=>lbScopeReps().length),4,'Common ranking includes all four KAM');}
 if(ownTeam){const other=roster.find(r=>r.tim!==ownTeam).login;const result=await page.evaluate(other=>{var before=PL_STATE.detailRep;plnenieOpenDetail(other);return PL_STATE.detailRep===before;},other);assert.equal(result,true,'Foreign comparison cannot open private representative panel');assert.deepEqual(await page.evaluate(()=>plnenieGetActiveReps().slice()),roster.filter(r=>r.tim===ownTeam).map(r=>r.login));}
 if(role==='am west'&&width===390&&!prefix)await page.screenshot({path:path.join(root,'.tmp/reagila-west-am-mobile.png')});
 assert.deepEqual(errors,[]);await context.close();console.log((prefix||'live/')+' '+width+' '+role+' '+username+': split/legacy boot,own roster,report scope and line isolation passed');
 }}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
