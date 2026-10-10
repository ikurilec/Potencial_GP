const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.SATORI_PLAYWRIGHT || 'playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let pending=[], detailPending=[], holdDetail=false;
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname==='satori.test'){
   let file=u.pathname==='/'?'index.html':u.pathname.slice(1);
   if(!process.env.SATORI_TEST_BUILD && /^dist\/app\..*\.js$/.test(file))file='app.js';
   const target=path.resolve(root,file);
   if(!target.startsWith(root+path.sep)||!fs.existsSync(target))return route.abort();
   return route.fulfill({body:fs.readFileSync(target),contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':undefined});
  }
  if(u.searchParams.get('action')==='getLekarne'){
   await new Promise(resolve=>pending.push({route,resolve,url:u}));return;
  }
  if(holdDetail && u.searchParams.get('action')==='getLekarneDetail'){
   await new Promise(resolve=>detailPending.push({route,resolve}));return;
  }
  if(u.hostname.includes('script.google'))return route.fulfill({json:{ok:true,rows:[],posts:[],events:[]}});
  return route.abort();
 });
 await page.goto('https://satori.test/');
 await page.waitForFunction(()=>typeof lkOpenDetail==='function');
 await page.evaluate(()=>document.body.classList.remove('login-active'));
 const row=m=>({login:'synthetic-rep',rok:2026,mesiac:m,okres:'Trenčín',mesto:'Trenčianska Teplá',lekaren:'Ariana, M. R. Štefánika 356',prods:{aflamil_kr:m}});
 for(const line of ['gp','reagila'])for(const role of ['rep','manager','ameast','am','boss','bum','pm','admin','asistent']){
  await page.evaluate(({role,line,rows})=>{
   closeAllPanels();document.querySelectorAll('.show').forEach(e=>e.classList.remove('show'));APP_LINE_EPOCH++;IS_DEV=false;
   getSession=()=>({username:'synthetic-rep',role:role==='manager'?'am west':role==='ameast'?'am east':role==='rep'&&line==='reagila'?'kam':role,line,session_token:'test'});
   document.body.classList.toggle('reagila-line',line==='reagila');
   document.body.classList.toggle('manager-mode',role!=='rep');document.body.classList.toggle('mgr-plnenie-detail-open',role!=='rep');
   LK_STATE.open=false;LK_STATE._rows=[];LK_MGR_ALL=[];
   lkSetCache('synthetic-rep',rows,false);
   const list=lkBuildLekarne(rows);
   if(role==='rep')LK_STATE._rows=list;else LK_MGR_ALL=list;
   lkOpenDetail(list[0].key);
  },{role,line,rows:[row(8)]});
  assert.match(await page.locator('#lk-detail-body').innerText(),/Aug 26/);
  await page.waitForTimeout(150);
  assert.equal(pending.length,1,'Opening cached detail must check server exactly once');
  const req=pending.shift();assert.equal(req.url.searchParams.get('fresh'),'1');
  await req.route.fulfill({json:{ok:true,rows:[row(8),row(9)]}});req.resolve();
  await page.waitForFunction(()=>document.getElementById('lk-detail-body').textContent.includes('Sep 26'));
  assert.equal(pending.length,0,'Repainting detail must not start another request');
  await page.evaluate(()=>{document.getElementById('lk-detail').classList.remove('show');lkOpenDetail(LK_DETAIL_OPEN_KEY);});
  await page.waitForTimeout(150);
  const failed=pending.shift();assert.ok(failed);
  await failed.route.fulfill({json:{ok:false,error:'Offline test'}});failed.resolve();
  await page.waitForFunction(()=>!Object.keys(_lkInFlight).length);
  assert.match(await page.locator('#lk-detail-body').innerText(),/Sep 26/,'Failed refresh preserves last data');
  await page.evaluate(()=>lkOpenDetail(LK_DETAIL_OPEN_KEY));
  await page.waitForTimeout(150);
  const late=pending.shift();assert.ok(late);
  await page.evaluate(()=>document.getElementById('lk-detail').classList.remove('show'));
  await late.route.fulfill({json:{ok:true,rows:[row(8),row(9),row(10)]}});late.resolve();
  await page.waitForFunction(()=>!Object.keys(_lkInFlight).length);
  assert.equal(await page.locator('#lk-detail').evaluate(el=>el.classList.contains('show')),false,'Late response must not reopen closed detail');
  console.log(line+' '+role+': September in detail, offline preservation and closed detail guard passed');
 }
 holdDetail=true;
 await page.evaluate(rows=>{
  document.body.classList.remove('reagila-line');
  getSession=()=>({username:'synthetic-rep',role:'boss',line:'gp',session_token:'test'});
  LK_MGR_ALL=lkBuildLekarne(rows);lkOpenDetail(LK_MGR_ALL[0].key);
 },[row(8),row(9)]);
 await page.waitForTimeout(200);
 assert.equal(detailPending.length,1);
 const status=page.locator('#lk-detail-body .lk-detail-load-status');
 assert.match(await status.innerText(),/Načítavam balenia a sily produktov/);
 assert.equal(await status.locator('.nst-spin').count(),1);
 assert.equal(await status.isVisible(),true);
 await page.screenshot({path:path.join(root,'.tmp-pharmacy-loading-detail.png')});
 assert.match(await page.locator('#lk-detail-body').innerText(),/Sep 26/);
 const base=pending.shift();assert.ok(base);
 await base.route.fulfill({json:{ok:true,rows:[row(8),row(9)]}});base.resolve();
 const badDetail=detailPending.shift();
 await badDetail.route.fulfill({json:{ok:false,error:'Synthetic failed detail'}});badDetail.resolve();
 await page.waitForFunction(()=>!LK_VARIANT_LOADING);
 assert.match(await status.innerText(),/Balenia sa nepodarilo načítať/);
 assert.equal(await status.locator('.nst-spin').count(),0);
 assert.match(await page.locator('#lk-detail-body').innerText(),/Sep 26/);
 holdDetail=false;
 await page.evaluate(()=>{
  document.body.classList.remove('reagila-line');
  LK_FILTER=lkFilterDefault();LK_FILTER._ctx='mgr';
  LK_MGR_ALL=lkBuildLekarne([
   {login:'synthetic-rep',rok:2026,mesiac:9,okres:'TN',mesto:'TN',lekaren:'Tablety',prods:{lonelix:9,lonelix_tb:9}},
   {login:'synthetic-rep',rok:2026,mesiac:9,okres:'TN',mesto:'TN',lekaren:'Sirup',prods:{lonelix:3,lonelix_sr:3}}
  ]);
  lkFilterOpen('mgr');
 });
 const tablets=page.locator('#lkf-body button.lkf-chip').filter({hasText:/^Lonelix tablety$/});
 const syrup=page.locator('#lkf-body button.lkf-chip').filter({hasText:/^Lonelix sirup$/});
 assert.equal(await tablets.count(),1);assert.equal(await syrup.count(),1);
 await tablets.click();
 assert.deepEqual(await page.evaluate(()=>LK_MGR_ALL.filter(lkFilterMatch).map(l=>l.lekaren)),['Tablety']);
 await page.screenshot({path:path.join(root,'.tmp-lonelix-filter.png')});
 assert.deepEqual(errors,[]);
 console.log('Visible loading/error indicators and independent Lonelix filter buttons passed');
 await page.unrouteAll({behavior:'ignoreErrors'});await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
