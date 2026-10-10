const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.SATORI_PLAYWRIGHT||'playwright');const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});let held=false,invalidReads=false,waiting=[],readCount=0,readLog=[];const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());if(u.hostname==='satori.test'){
   let f=u.pathname==='/'?'index.html':u.pathname.slice(1);if(!process.env.SATORI_TEST_BUILD&&/^dist\/app\..*\.js$/.test(f))f='app.js';
   const p=path.resolve(root,f);if(!p.startsWith(root+path.sep)||!fs.existsSync(p))return route.abort();return route.fulfill({body:fs.readFileSync(p),contentType:f.endsWith('.js')?'application/javascript':f.endsWith('.css')?'text/css':f.endsWith('.html')?'text/html':undefined});
  }
  if(u.hostname.includes('script.google')){
   const action=u.searchParams.get('action');if(/^(getLekarneAll|getLekarne|getGynLekarne|getHistory|getAllHistory)$/.test(action||'')){readCount++;readLog.push(action);}const login=u.searchParams.get('login')||'rep';
   const row={login,lekaren:'Lekáreň Septembrová',okres:'Senec',mesto:'Senec',rok:2026,mesiac:9,prods:{lonelix_tb:7},produkt:'Escapelle',box:7};
   let d={ok:true,rows:[row],events:[],posts:[{id:'p1',text:'Čerstvé oznámenie',meno:'Kolega',ts:'2026-10-10T08:00:00Z',comments:[]}],reps:[],plan:{},predaje:{}};
   if(action==='getAllHistory')d={rep:[{lekar:'MUDr. Novák',okres:'Senec',datum:'2026-09-30'}]};if(action==='getHistory')d=[{lekar:'MUDr. Novák',okres:'Senec',datum:'2026-09-30'}];
   if(invalidReads&&/getLekarne|getGynLekarne|getAllHistory|getHistory/.test(action))d={ok:false,error:'Synthetic unavailable source'};
   if(held&&/getLekarne|getGynLekarne|getAllHistory|getHistory/.test(action)){await new Promise(r=>waiting.push(r));}
   return route.fulfill({json:d});
  }return route.abort();
 });
 await page.goto('https://satori.test/');await page.waitForFunction(()=>typeof gsOpen==='function');
 for(const line of ['gp','gyn','reagila'])for(const role of (line==='gyn'?['gyn-rep','gyn-am','gyn-pm','gyn-bum','admin','gyn-asistent']:['rep west','am west','boss','bum','admin','asistent'])){
  await page.evaluate(({line,role})=>{
   gsClose();document.querySelectorAll('.show').forEach(e=>e.classList.remove('show'));APP_LINE_EPOCH++;
   getSession=()=>({username:'rep',name:'Test',role,line:line==='gp'?undefined:line,session_token:'synthetic'});
   IS_DEV=false;document.body.classList.remove('login-active');document.getElementById('login-screen').style.display='none';
   document.body.classList.toggle('gyn-line',line==='gyn');document.body.classList.toggle('manager-mode',line!=='gyn'&&role!=='rep west');document.body.classList.toggle('reagila-line',line==='reagila');document.body.classList.add('app-nav');
   MGR_STATE.role=mgrDetectRole(getSession());MGR_STATE.reps={rep:{visits:[]}};MGR_ALL=['rep'];MGR_AM_WEST=['rep'];MGR_REP_NAMES.rep='Kolega Reprezentant';
   GYN_STATE.repList=[{login:'rep',meno:'Kolega Reprezentant',region:'BAPI',linia:'pill'}];GYN_LB.repList=GYN_STATE.repList;
   TEAM_PL_STATE.payload={reps:[{username:'rep',name:'Kolega Reprezentant',role:'rep west'}]};
   LK_STATE.cache={};LK_STATE._rows=[];GYN_LK.cache={};GS_DATA={owner:'',pharmacies:{},history:{},pending:0,failed:0};NST.posts=[];
   gsApplyEnabled();gsOpen();
  },{line,role});
  for(const title of ['Domov','Plnenie','Kalendár','Nástenka','Menu','Sklady','Rebríček'])assert.ok(await page.evaluate(t=>GS.items.some(e=>e.title===t),title),line+'/'+role+' missing '+title);
  const before=readCount;await page.waitForTimeout(250);
  assert.equal(readCount,before,'Opening the navigator must not trigger data downloads');
  await page.locator('#gs-input').fill('Sklady');await page.waitForTimeout(250);
  assert.equal(readCount,before,'Exact navigation queries must not fetch entities: '+readLog.slice(before).join(',')+' '+line+'/'+role);
  await page.locator('#gs-input').fill('septembrova');await page.waitForFunction(()=>GS.flat.some(e=>e.type==='pharmacy'));
  assert.ok(await page.locator('.gs-row-top').innerText().then(t=>t.includes('Septembrová')));
  await page.waitForFunction(()=>gsData().pending===0,{},{timeout:15000});
  const ready=readCount;await page.locator('#gs-input').fill('sept');await page.waitForTimeout(300);
  assert.equal(readCount,ready,'Repeated queries reuse successfully loaded sources');
  if(line==='gp'&&role==='rep west'){
   await page.evaluate(()=>{const d=gsData();Object.keys(d.times).forEach(k=>d.times[k]=Date.now()-91000);Object.keys(d.attempts).forEach(k=>d.attempts[k]=Date.now()-21000);Object.values(APP_READ_META).forEach(e=>e.ts=Date.now()-91000);gsEnsureData();});
   await page.waitForFunction(()=>gsData().pending===0);
   assert.ok(readCount>ready,'Expired successful sources must be fetched again');
  }
  if(line!=='gyn'){await page.locator('#gs-input').fill('novak');assert.ok(await page.evaluate(()=>GS.flat.some(e=>e.type==='doctor')),line+'/'+role+' '+JSON.stringify(await page.evaluate(()=>({data:gsData(),items:GS.items.filter(e=>e.type==='doctor'),allowed:gsAllowedLogins()}))));}
  await page.locator('#gs-input').fill('sklad');assert.ok(await page.locator('.gs-row-top').innerText().then(t=>t.includes('Sklady')));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 }
 console.log('18 actual line/role menus, remote pharmacies before list opens, doctors, accent-free autocomplete and mobile widths passed');
 // Real navigation to stock screen must close Home and search, retaining back handling.
 await page.evaluate(()=>{getSession=()=>({username:'rep',role:'rep west'});document.body.classList.remove('manager-mode','gyn-line','reagila-line');appGoDomov();gsOpen();});
 await page.locator('#gs-input').fill('sklady');await page.locator('.gs-row-top').click();await page.waitForFunction(()=>document.getElementById('sklady-overlay').classList.contains('show'));
 assert.equal(await page.locator('#gs-overlay').evaluate(e=>e.classList.contains('show')),false);
 await page.evaluate(()=>closeSklady());await page.waitForFunction(()=>document.getElementById('dnes-overlay').classList.contains('show'));
 console.log('Real Home → navigator → Stocks → Back route passed');
 // Direct pharmacy navigation must work without ever opening its list first.
 await page.evaluate(()=>gsOpen());await page.waitForFunction(()=>gsData().pending===0);
 await page.locator('#gs-input').fill('septembrova');await page.waitForFunction(()=>GS.flat.some(e=>e.type==='pharmacy'));await page.locator('.gs-row-top').click();
 await page.waitForFunction(()=>document.getElementById('lk-detail').classList.contains('show'));
 assert.match(await page.locator('#lk-detail-body').innerText(),/Sep 26/);
 await page.evaluate(()=>{gsClose();document.querySelectorAll('.show').forEach(e=>e.classList.remove('show'));APP_LINE_EPOCH++;getSession=()=>({username:'rep',role:'gyn-rep',line:'gyn',region:'BAPI'});document.body.classList.add('gyn-line');gsOpen();});
 await page.waitForFunction(()=>gsData().pending===0);await page.locator('#gs-input').fill('septembrova');await page.waitForFunction(()=>GS.flat.some(e=>e.type==='pharmacy'));await page.locator('.gs-row-top').click();
 await page.waitForFunction(()=>GYN_LK.detailKey && !!document.querySelector('.lk-det-back'));
 assert.match(await page.locator('#gyn-content').innerText(),/Septembrová/);
 console.log('Direct GP and Gyn pharmacy detail, including latest September history, passed');
 await page.evaluate(()=>{APP_LINE_EPOCH++;getSession=()=>({username:'manager',role:'gyn-am',line:'gyn',region:'BAPI'});GYN_APP.plCache={};GYN_APP.plLoading={};GYN_LK.login='';GYN_LK.rows=[];gsOpen();});
 await page.waitForFunction(()=>gsData().pending===0);await page.locator('#gs-input').fill('septembrova');await page.waitForFunction(()=>GS.flat.some(e=>e.type==='pharmacy'));await page.locator('.gs-row-top').click();
 await page.waitForFunction(()=>GYN_APP.detailLogin==='rep'&&GYN_LK.detailKey&&document.querySelector('#gyn-rd-lekarne .lk-det-back'));
 console.log('Gyn manager direct pharmacy waits for uncached fulfillment detail before opening its pharmacy tab');
 await page.evaluate(()=>{APP_LINE_EPOCH++;getSession=()=>({username:'manager',role:'am west',session_token:'synthetic'});document.body.classList.remove('gyn-line');document.body.classList.add('manager-mode');document.querySelector('.app').style.display='';document.getElementById('mgr-view').classList.add('show');MGR_STATE.role='amwest';MGR_STATE.reps={rep:{visits:[]}};gsOpen();});
 await page.waitForFunction(()=>gsData().pending===0);await page.locator('#gs-input').fill('novak');await page.waitForFunction(()=>GS.flat.some(e=>e.type==='doctor'));await page.locator('.gs-row-top').click();
 await page.waitForFunction(()=>document.getElementById('mgr-vsearch').value==='MUDr. Novák');
 assert.match(await page.locator('#mgr-vlist').innerText(),/Novák/);
 invalidReads=true;await page.evaluate(()=>{gsOpen();gsEnsureData(true);});await page.waitForFunction(()=>gsData().pending===0);
 await page.locator('#gs-input').fill('novak');assert.equal(await page.locator('.gs-row-top').count(),1);
 assert.match(await page.locator('.gs-data-status').innerText(),/nepodarilo/);
 assert.equal(await page.locator('.gs-data-status .nst-spin').count(),0);invalidReads=false;
 await page.evaluate(()=>gsEnsureData(true));await page.waitForFunction(()=>gsData().pending===0);
 assert.equal(await page.evaluate(()=>gsData().failed),0,'A successful retry clears failed source status');
 console.log('Manager doctor opens fresh authorized history; failed sources stop loading and preserve searchable results');
 // Completion from old line/account must never add data to a new index.
 held=true;
 await page.evaluate(()=>{gsClose();APP_LINE_EPOCH++;getSession=()=>({username:'rep',role:'rep west'});gsData().pharmacies={};gsOpen();gsEnsureData(true);});await page.waitForFunction(()=>gsData().pending>0);
 await page.evaluate(()=>{APP_LINE_EPOCH++;getSession=()=>({username:'new',role:'gyn-rep',line:'gyn'});gsData();gsClose();});
 held=false;waiting.splice(0).forEach(r=>r());await page.waitForTimeout(300);
 assert.equal(await page.evaluate(()=>Object.keys(gsData().pharmacies).length),0);
 assert.equal(await page.evaluate(()=>gsData().pending),0);
 await page.setViewportSize({width:320,height:740});await page.evaluate(()=>gsOpen());await page.locator('#gs-input').fill('nastavenia');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.waitForTimeout(300);
 assert.equal(await page.locator('#gs-input').evaluate(e=>{const r=e.getBoundingClientRect();return document.elementFromPoint(r.x+5,r.y+5)===e;}),true,'Search input is above all current line panels');
 await page.screenshot({path:path.join(root,'.tmp-navigator-mobile.png')});
 assert.deepEqual(errors,[]);console.log('Stale callbacks, keyboard buttons, 320px layout and no JavaScript page errors passed');await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
