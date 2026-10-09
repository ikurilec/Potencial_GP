// Isolated browser test: synthetic accounts and mocked read endpoints only.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.SATORI_PLAYWRIGHT || 'playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let reads=[];
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname==='satori.test'){
   let file=u.pathname==='/'?'index.html':u.pathname.slice(1);
   if(!process.env.SATORI_TEST_BUILD && file.startsWith('dist/app.')&&file.endsWith('.js'))file='app.js';
   if(!process.env.SATORI_TEST_BUILD && file.startsWith('dist/app.')&&file.endsWith('.css'))file='app.css';
   const target=path.resolve(root,file);
   if(!target.startsWith(root+path.sep)||!fs.existsSync(target))return route.abort();
   return route.fulfill({body:fs.readFileSync(target),contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':undefined});
  }
  if(['getLekarne','getLekarneDetail'].includes(u.searchParams.get('action')) || u.hostname==='read.test'){
   await new Promise(resolve=>reads.push({route,resolve,url:u}));return;
  }
  if(u.hostname.includes('script.google'))return route.fulfill({json:{ok:true,posts:[],events:[]}});
  return route.abort();
 });
 await page.addInitScript(() => {const NativeDate=Date; window.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:['2026-10-09T12:00:00Z']));} static now(){return NativeDate.now();}};});
 await page.goto('https://satori.test/');
 await page.waitForFunction(()=>typeof openSklady==='function');

 const row=(qty,month=8)=>({login:'synthetic-rep',rok:2026,mesiac:month,okres:'Poprad',mesto:'Poprad',lekaren:'Testovacia lekáreň',prods:{aflamil_kr:qty,aflamil_tb:5}});
 async function respond(data,action='getLekarne'){for(let i=0;i<100&&!reads.some(r=>r.url.searchParams.get('action')===action);i++)await page.waitForTimeout(20);const idx=reads.findIndex(r=>r.url.searchParams.get('action')===action);assert.ok(idx>=0,'Expected pharmacy read '+action);const r=reads.splice(idx,1)[0];await r.route.fulfill({json:data});r.resolve();return r.url;}
 for(const role of ['manager','admin','rep']){
  await page.evaluate(({role,rows})=>{
   closeAllPanels();document.querySelectorAll('.show').forEach(e=>e.classList.remove('show'));APP_LINE_EPOCH++;IS_DEV=false;
   window.testUser={username:'synthetic-rep',name:'Test',line:'gp',role,session_token:'synthetic'};getSession=()=>window.testUser;
   document.querySelector('.app').style.visibility='visible';document.getElementById('login-screen').style.display='none';document.body.classList.remove('login-active');
   document.body.classList.toggle('manager-mode',role!=='rep');document.body.classList.toggle('mgr-plnenie-detail-open',role!=='rep');
   lkSetCache('synthetic-rep',rows,false);
   if(role==='rep'){openLekarne();}else{MGR_STATE.subtab='plnenie';document.getElementById('pl-detail-lekarne').style.display='';document.getElementById('pl-detail-predaje').style.display='none';lkMgrLoadForRep('synthetic-rep');}
  },{role,rows:[row(1,1),row(4,6),row(5,7),row(6),{...row(0,10),prods:{aflamil_tb:5}}]});
  const selector=role==='rep'?'#lk-list':'#pl-detail-lekarne-body';
  await page.waitForFunction(()=>!!document.querySelector('.nst-spin'));
  let text=await page.locator(selector).innerText();assert.match(text,/Aug: 6 bal/);assert.match(text,/Okt: 0 bal/);assert.match(text,/Aug 2026 · 6 bal/);
  const url=await respond({ok:true,rows:[row(1,1),row(4,6),row(5,7),row(9),{...row(0,10),prods:{aflamil_tb:5}}]});assert.equal(url.searchParams.get('fresh'),'1');
  await page.waitForFunction(sel=>document.querySelector(sel).textContent.includes('Aug: 9 bal'),selector);
  const detail=await respond({ok:true,rows:[]},'getLekarneDetail');assert.equal(detail.searchParams.get('action'),'getLekarneDetail');
  await page.waitForFunction(()=>!document.querySelector('.nst-spin'));
  assert.equal(reads.length,0,'No duplicate detail fetch from cache/fresh callbacks');
  console.log(role+': cache, fresh quantities, report period and completed spinner passed');
 }
 assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});



