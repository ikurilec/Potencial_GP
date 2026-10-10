// Isolated browser test: synthetic accounts and mocked read endpoints only.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.SATORI_PLAYWRIGHT || 'playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let reads=[],holdAll=false;
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
  if(u.searchParams.get('action')==='getStockData' || u.hostname==='read.test' || (holdAll && u.hostname.includes('script.google') && /^get/.test(u.searchParams.get('action')||''))){
   await new Promise(resolve=>reads.push({route,resolve,url:u}));return;
  }
  if(u.hostname.includes('script.google'))return route.fulfill({json:{ok:true,posts:[],events:[]}});
  return route.abort();
 });
 await page.goto('https://satori.test/');
 await page.waitForFunction(()=>typeof openSklady==='function');
 const payload=(line,days,date)=>({ok:true,as_of:date,rows:[{line,product_key:'sample',product:'Ukážkový produkt',packaging:'30 tbl',availability:'available',coverage_days:days,distributor_units:100}]});
 async function open(line,role,cached){
  await page.evaluate(({line,role,cached})=>{
   closeAllPanels();APP_LINE_EPOCH++;
   window.testUser={username:'synthetic-user',name:'Testovací používateľ',line,role,region:'KE',session_token:'synthetic'};
   getSession=()=>window.testUser;IS_DEV=false;
   document.getElementById('login-screen').style.display='none';
   document.body.classList.remove('login-active');document.querySelector('.app').style.visibility='visible';
   document.querySelectorAll('.show').forEach(e=>e.classList.remove('show'));
   DataStore.set(stockCacheKey_(line),cached);openSklady();
  },{line,role,cached});
  await page.waitForFunction(()=>!!document.querySelector('#sklady-overlay .app-read-check .nst-spin'));
  await page.waitForFunction(()=>SKLADY_STATE.payload && SKLADY_STATE.payload.products.length===1);
 }
 async function nextRead(){for(let i=0;i<50&&!reads.length;i++)await new Promise(r=>setTimeout(r,20));assert.ok(reads.length,'Opening cached stocks must contact the server');return reads.shift();}
 async function respond(read,data){await read.route.fulfill({json:data});read.resolve();}
 for(const line of ['gp','gyn','reagila'])for(const role of ['admin','manager','rep']){
  const cached=payload(line,12,'2026-09-28');await open(line,role,cached);
  assert.ok((await page.locator('#sklady-body').innerText()).includes('28. september'),'Cached date is immediately visible');
  const read=await nextRead();assert.equal(read.url.searchParams.get('fresh'),'1');
  await page.locator('.sklady-product').click();
  await respond(read,payload(line,22,'2026-10-08'));
  await page.waitForFunction(()=>SKLADY_STATE.payload.products[0].coverageDays===22);
  await page.waitForFunction(()=>!document.querySelector('#sklady-overlay .app-read-check .nst-spin'));
  assert.equal(await page.locator('.sklady-pack').count(),1,'Expanded product survives refresh');
  console.log(line+'/'+role+': immediate cache, spinner, fresh data and expansion passed');
 }
 const same=payload('gp',12,'2026-09-28');await open('gp','rep',same);await respond(await nextRead(),same);
 await page.waitForFunction(()=>!document.querySelector('#sklady-overlay .app-read-check .nst-spin'));
 assert.equal(await page.locator('.sklady-product').count(),1);
 await open('gp','rep',same);
 for(let i=0;i<2;i++){const read=await nextRead();await read.route.abort();read.resolve();}
 await page.waitForFunction(()=>document.querySelector('.app-read-check')?.textContent.includes('Obnova zlyhala'));
 assert.equal(await page.evaluate(()=>SKLADY_STATE.payload.products[0].coverageDays),12,'Offline failure preserves cached data');
 await page.screenshot({path:path.join(root,'.tmp-stock-offline.png')});
 // Switching lines while an old read finishes must preserve the newly selected line.
 await open('gp','rep',same);const old=await nextRead();
 await open('gyn','rep',payload('gyn',15,'2026-09-28'));const current=await nextRead();
 await respond(current,payload('gyn',26,'2026-10-08'));
 await page.waitForFunction(()=>SKLADY_STATE.payload.products[0].coverageDays===26);
 await respond(old,payload('gp',99,'2026-10-08'));
 await page.waitForTimeout(500);
 assert.equal(await page.evaluate(()=>SKLADY_STATE.payload.products[0].coverageDays),26);
 holdAll=true;
 for(const [id,action] of [['hist-overlay','getHistory'],['rep-plnenie-overlay','getPlnenieAll'],['lk-overlay','getLekarne'],['lb-overlay','getPlnenieAll'],['okresy-overlay','getConfig'],['pharma-ms-overlay','getPharmaData'],['golem-cal-overlay','getCalEvents']]){
  await page.evaluate(({id,action})=>{
   document.querySelectorAll('.show').forEach(e=>e.classList.remove('show'));
   _panelCurrent=id;document.getElementById(id).classList.add('show');
   appFetchJson(gynScriptUrl('action='+action)).catch(()=>{});
  },{id,action});
  await page.waitForFunction(id=>!!document.querySelector('#'+id+' .app-read-check .nst-spin'),id);
  await respond(await nextRead(),{ok:true,rows:[],events:[],summary:[],plan:{},predaje:{}});
  await page.waitForFunction(id=>!document.querySelector('#'+id+' .app-read-check .nst-spin'),id);
  console.log(id+': active read indicator and completion passed');
 }
 // A retry delay must not make the spinner disappear or briefly claim failure.
 await page.evaluate(()=>{appFetchWithRetry(gynScriptUrl('action=getCalEvents'),{retries:1,priority:'critical',delayFn:()=>800}).catch(()=>{});});
 const retryFirst=await nextRead();await retryFirst.route.abort();retryFirst.resolve();
 await page.waitForTimeout(500);
 assert.ok(await page.locator('#golem-cal-overlay .app-read-check .nst-spin').count(),'Spinner must span the retry delay');
 await respond(await nextRead(),{ok:true});
 await page.waitForFunction(()=>!document.querySelector('#golem-cal-overlay .app-read-check .nst-spin'));
 // Writes must not be turned into fresh reads or show a background refresh spinner.
 await page.evaluate(()=>{appFetchJson('https://read.test/?action=saveExample',{method:'POST',body:'synthetic'}).catch(()=>{});});
 const write=await nextRead();assert.equal(write.url.searchParams.has('fresh'),false);await respond(write,{ok:true});
 for(const width of [320,390,430]){
  await page.setViewportSize({width,height:844});await open('gp','rep',same);
  const read=await nextRead();
  const layout=await page.locator('#sklady-overlay').evaluate(el=>({scroll:el.scrollWidth,width:el.clientWidth,spin:!!el.querySelector('.nst-spin')}));
  assert.ok(layout.scroll<=layout.width,'Stock cards and status must fit a '+width+'px phone');assert.ok(layout.spin);
  await respond(read,same);await page.waitForFunction(()=>!document.querySelector('#sklady-overlay .app-read-check .nst-spin'));
 }
 assert.deepEqual(errors,[],'No application JavaScript errors');
 console.log('Browser: unchanged response, automatic retry and offline cache fallback passed.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
