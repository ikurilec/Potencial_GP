const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.SATORI_PLAYWRIGHT||'C:/Users/Ivan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{for(const prefix of ['','nahlad/']){
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname==='satori.test'){let file=u.pathname.slice(1)||'index.html';const match=file.match(/^(nahlad\/)?dist\/app\.[a-f0-9]{8}\.(js|css)$/);if(match&&!process.env.SATORI_BUILT_TEST)file=(match[1]||'')+'app.'+match[2];const p=path.join(root,file);return fs.existsSync(p)?r.fulfill({path:p}):r.fulfill({status:404,body:''});}if(r.request().resourceType()==='image')return r.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF9sAAAAASUVORK5CYII=','base64')});if(r.request().resourceType()==='script')return r.fulfill({body:'',contentType:'application/javascript'});return r.fulfill({json:{ok:true,reps:[],posts:[],events:[],rows:[]}});});
 await page.goto('https://satori.test/'+prefix+'index.html');await page.waitForFunction(()=>typeof usageRenderTeam==='function');
 for(const line of ['gp','reagila']){
  await page.evaluate(line=>{
   getSession=()=>({username:'admin',name:'Test Admin',role:'admin',line,session_token:'fixture'});IS_DEV=false;MGR_STATE={role:'admin',managers:[],reps:{}};MGR_REP_NAMES={kam:'Michaela Šibert',second:'Ľudmila Hricová'};MGR_ALL=['kam','second'];LB_ALL_REPS=MGR_ALL.slice();USERS_LOCAL={kam:{name:'Michaela Šibert',avatar:{style:'adventurer',hair:'long01'}},second:{name:'Ľudmila Hricová',avatar:null}};LB_REP_INFO={};USAGE_MANAGER_PROFILES=null;
   plnenieGetActiveReps=()=>MGR_ALL.slice();mgrRenderList=()=>{};allHistJoin=()=>null;allHistTrack=p=>p;window.profileRequests=0;
   mgrFetchWithRetry=url=>url.includes('getManagers')?(window.profileRequests++,new Promise(r=>window.resolveProfiles=r)):url.includes('getLastLogins')?Promise.resolve({}):new Promise(()=>{});
   USAGE_VIEW.line='gp';USAGE_VIEW.bodyId='identity-fixture';USAGE_VIEW.currentRep=null;
   let body=document.getElementById('identity-fixture');if(!body){body=document.createElement('div');body.id='identity-fixture';document.body.appendChild(body);}body.style.cssText='display:block;max-width:450px;padding:16px;background:#e9ecf3';
   document.querySelectorAll('body > :not(#identity-fixture)').forEach(e=>e.style.display='none');
   const reps={};['kam','second','l.faber','e.starostova','v.dzurilla','j.gavlak'].forEach(login=>reps[login]={opens:2,timeS:120,last:new Date().toISOString(),sections:{Plnenie:2}});window.identityFixture={ok:true,reps,team:{},push:{},today:'2026-10-18'};
   mgrLoadReps(MGR_ALL);usageLoadManagers();usageRenderTeam(identityFixture);
  },line);
  assert.equal(await page.evaluate(()=>profileRequests),1,'Activity and manager landing share the lightweight profiles request');
  await page.evaluate(()=>resolveProfiles([
   {username:'l.faber',name:'Lenka Fáber',role:'am east',avatar:JSON.stringify({style:'adventurer',hair:'long01'})},
   {username:'e.starostova',name:'Eva Starostová',role:'bum',avatar:''},
   {username:'v.dzurilla',name:'Viktor Dzurilla',role:'pm',avatar:JSON.stringify({style:'adventurer',hair:'short01'})},
   {username:'j.gavlak',name:'Juraj Gavlák',role:'boss',avatar:''}
  ]));
  const card=login=>page.locator('.act-rep').filter({has:page.locator('.act-rep-avatar[data-username="'+login+'"]')});
  await page.waitForFunction(()=>document.querySelector('#identity-fixture').textContent.includes('Lenka Fáber'));
  for(const [login,name,initials,hasAvatar] of [['l.faber','Lenka Fáber','LF',true],['e.starostova','Eva Starostová','ES',false],['v.dzurilla','Viktor Dzurilla','VD',true],['j.gavlak','Juraj Gavlák','JG',false],['second','Ľudmila Hricová','ĽH',false]]){
   assert.equal(await card(login).locator('.act-rep-nametxt').innerText(),name);assert.equal(await card(login).locator('.avatar-img').count(),hasAvatar?1:0);if(!hasAvatar)assert.equal(await card(login).locator('.act-rep-avatar').innerText(),initials);
  }
  await page.evaluate(()=>{USERS_LOCAL.second={name:'Ľudmila Hricová Nová',avatar:{style:'adventurer',hair:'long02'}};avatarRefreshAllInDom();});assert.equal(await card('second').locator('.act-rep-nametxt').innerText(),'Ľudmila Hricová Nová');assert.equal(await card('second').locator('.avatar-img').count(),1);
  await page.evaluate(()=>{localStorage.setItem('avatar_cfg_j.gavlak',JSON.stringify({style:'adventurer',hair:'short02'}));window.dispatchEvent(new CustomEvent('avatar-changed',{detail:{username:'j.gavlak'}}));});assert.equal(await card('j.gavlak').locator('.avatar-img').count(),1,'Avatar changes update the already rendered activity card');
  if(line==='reagila')await page.screenshot({path:path.join(root,'.tmp/activity-identities-'+(prefix?'preview':'live')+'.png')});
  await page.evaluate(()=>usageRenderRep({events:[]},'l.faber'));assert.equal(await page.locator('.act-dhdr-name').innerText(),'Lenka Fáber');assert.equal(await page.locator('.act-dhdr-avatar .avatar-img').count(),1);
  await page.evaluate(()=>usageApplyManagers([{username:'l.faber',name:'Lenka Fáber',role:'am east',avatar:''}]));assert.equal(await page.locator('.act-dhdr-avatar').innerText(),'LF');assert.equal(await page.locator('.act-dhdr-avatar .avatar-img').count(),0);
 }
 await page.evaluate(()=>{getSession=()=>({username:'admin',name:'Test Admin',role:'admin',line:'gyn',session_token:'fixture'});USAGE_VIEW.line='gyn';GYN_STATE.repList=[];GYN_STATE.userList=[];USERS_LOCAL={};usageRenderRep({events:[]},'manager');gynApplyUsersList([{login:'manager',meno:'Manažérka Gynekológie',avatar:JSON.stringify({style:'adventurer',hair:'long01'})}]);});assert.equal(await page.locator('.act-dhdr-name').innerText(),'Manažérka Gynekológie');assert.equal(await page.locator('.act-dhdr-avatar .avatar-img').count(),1);
 assert.deepEqual(errors,[]);await context.close();console.log((prefix||'live/')+': GP/Reagila delayed manager profiles with stalled visits,full names,avatars/initials,list/detail,late roster/avatar events and GYN user profiles passed');
 }}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
