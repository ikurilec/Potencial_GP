'use strict';
// Hold the final reload to inspect every frame of session teardown on slow devices.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),M=require('../garage-model.js');
const {chromium}=require(process.env.SATORI_PLAYWRIGHT||'C:/Users/Ivan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});let count=0;
 try{for(const prefix of ['', 'nahlad/'])for(const width of [390,412,1280]){
  const context=await browser.newContext({viewport:{width,height:850},isMobile:width<500,hasTouch:width<500,serviceWorkers:'block'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='satori.test')return r.abort();let f=u.pathname.slice(1)||'index.html';if(process.env.SATORI_LOGOUT_SOURCE&&/^(nahlad\/)?dist\/app\.[a-f0-9]+\.js$/.test(f))f=prefix+'app.js';const p=path.resolve(root,f);return p.startsWith(root+path.sep)&&fs.existsSync(p)?r.fulfill({path:p}):r.abort();});
  await page.goto('https://satori.test/'+prefix+'index.html');await page.waitForFunction(()=>typeof confirmLogout==='function'&&typeof SatoriGarage==='object');
  const scenarios=[['gp','admin'],['gp','rep west'],['gyn','gyn-am'],['gyn','gyn-rep'],['reagila','am east'],['reagila','kam'],['gp','office','garage'],['gp','fleet','garage'],['gp','admin','garage'],['gyn','gyn-am','settings'],['gp','rep west','expired']];
  for(const [line,role,mode] of scenarios){
   const state=M.createState();state.members=[{id:'logout.fixture',name:'Test používateľ',role:role==='admin'?'admin':'office',active:true,access:true}];
   await page.evaluate(async({line,role,mode,state})=>{
    SatoriGarage.reset();document.body.className='';document.querySelectorAll('.show').forEach(e=>e.classList.remove('show'));document.getElementById('boot-loader')?.remove();
    window.reloadRequested=false;window.logoutCalls=[];appReload=()=>{reloadRequested=true;};fetch=async(url)=>{logoutCalls.push(String(url));return {ok:true,json:async()=>({ok:true})};};
    setSession({username:'logout.fixture',name:'Test používateľ',role,line,session_token:'synthetic-token',device_id:'synthetic-device',rememberMe:true,session_expires_at:new Date(Date.now()+3600000).toISOString()});
    localStorage.setItem(MGR_DUAL_KEY,JSON.stringify({username:'logout.fixture',gp:getSession()}));sessionStorage.setItem(MGR_DUAL_KEY,localStorage.getItem(MGR_DUAL_KEY));
    loginScreenSetExclusive(false);const app=document.querySelector('.app');app.style.display='block';app.style.visibility='visible';
    document.body.classList.toggle('manager-mode',!/^(rep|gyn-rep|kam|office|fleet)/.test(role));
    if(line==='gyn'){app.style.display='none';document.getElementById('gyn-view').classList.add('show');}
    if(mode==='garage'){document.body.classList.toggle('garage-office-only',role==='office'||role==='fleet');SatoriGarage.configure({getSession,headerMarkup:null,getLineTargets:()=>[{line:'garage'}],transport:async()=>SatoriGarageModel.snapshot(state,{id:'logout.fixture'},{today:'2026-10-23'})});await SatoriGarage.open();}
    if(mode==='settings')document.getElementById('settings-overlay').classList.add('show');
    // A cancelled confirmation must leave the signed-in view untouched.
    doLogout();closeLogoutConfirm();window.cancelKeptSession=!!getSession()&&!document.body.classList.contains('login-active');
    // A finishing boot can reveal the base .app as the Garage is torn down.
    bootLoaderShow(true);doLogout();
    window.logoutFrames=[];window.logoutSample=()=>{const app=document.querySelector('.app'),login=document.getElementById('login-screen');logoutFrames.push({hidden:getComputedStyle(app).display==='none',login:getComputedStyle(login).display!=='none'});};
    if(mode==='settings')settingsLogout();else if(mode==='expired'){clearSession();showSessionExpiredModal();}else confirmLogout();
    logoutSample();window.logoutUntil=performance.now()+460;function sample(){logoutSample();if(performance.now()<logoutUntil)requestAnimationFrame(sample);}requestAnimationFrame(sample);
    // Exercise a late completion after teardown too.
    bootLoaderDone();
   },{line,role,mode,state});
   const first=await page.evaluate(()=>({cancel:cancelKeptSession,session:getSession(),frame:logoutFrames[0],reload:reloadRequested,remembered:localStorage.getItem(SESSION_KEY),dual:localStorage.getItem(MGR_DUAL_KEY)}));
   assert.equal(first.cancel,true);assert.equal(first.session,null);assert.equal(first.remembered,null);assert.equal(first.dual,null);
   assert.equal(first.frame.hidden,true,prefix+' '+line+'/'+role+'/'+mode+': medical content is hidden before reload');assert.equal(first.frame.login,true,'Login is ready before teardown uncovers old views');
   assert.equal(first.reload,mode!=='expired');await page.waitForTimeout(520);
   assert.ok(await page.evaluate(()=>logoutFrames.length>2&&logoutFrames.every(x=>x.hidden&&x.login)),'No animation frame may expose the base form while navigation is delayed');
   if(mode==='garage')assert.equal(await page.locator('#satori-garage').count(),0);
   if(mode==='expired'){assert.ok(await page.locator('#session-expired-overlay').isVisible());await page.evaluate(()=>confirmLogout());assert.ok(await page.evaluate(()=>reloadRequested));}
   if(mode!=='settings'&&mode!=='expired')assert.ok(await page.evaluate(()=>logoutCalls.some(u=>new URL(u).searchParams.get('action')==='logoutSession')),'Existing server logout is preserved');
   count++;
  }
  await page.reload();await page.waitForFunction(()=>typeof getSession==='function'&&!getSession()&&document.body.classList.contains('login-active'));
  assert.ok(await page.locator('#login-screen').isVisible());assert.equal(await page.locator('.app').isVisible(),false,'The next document also starts directly on login');
  assert.deepEqual(errors,[]);await context.close();console.log((prefix||'live/')+' '+width+': 11 logout, cancel, expiry, Garage and late-boot cases plus actual reload passed');
 }}finally{await browser.close();}console.log(count+' built logout transition cases passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
