const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
// Preview first: SATORI_APP_DIR=. checks the live root once the change is promoted.
const repo=path.resolve(__dirname,'..'),root=path.resolve(repo,process.env.SATORI_APP_DIR||'nahlad');
const {chromium}=require(process.env.SATORI_PLAYWRIGHT||path.resolve(repo,'../../node_modules/playwright-core'));
const day='2026-10-19';




function member(id,name){return {id,name,role:'office',weeklyDays:3,active:true};}
function fixture(admin){
 const slots=Array.from({length:8},(_,i)=>({id:'b'+(i<6?3:1)+'-'+(i+1),number:String(1230+i),floor:i<6?-3:-1,order:i,active:true,allowedMembers:[]}));
 const res=(id,owner,name,spaceId,date)=>({id,revision:1,date,owner,name,spaceId,start:'08:00',end:'16:30'});
 return {ok:true,version:1,serverDate:day,window:{start:day,end:'2026-11-17'},me:{id:'fixture-user',name:'Testovací používateľ',role:admin?'admin':'office',weeklyDays:3,canAdmin:!!admin},
  config:{slots,defaultStart:'08:00',defaultEnd:'16:30',workingDays:[1,2,3,4,5]},
  members:[member('fixture-user','Testovací používateľ'),member('eva','Eva Starostová')],
  attendance:[{date:'2026-10-19',owner:'fixture-user',name:'Testovací používateľ',start:'08:00',end:'16:30'}],
  reservations:[res('r-mine','fixture-user','Testovací používateľ','b3-1','2026-10-19'),res('r-eva','eva','Eva Starostová','b3-2','2026-10-22')],
  offers:[{id:'o1',type:'transfer',from:'eva',to:'fixture-user',fromReservationId:'r-eva',status:'pending',expiresAt:new Date(Date.now()+2*86400000).toISOString()}],
  waitlist:[],blocks:[],audit:[]};
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.SATORI_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>{const u=new URL(r.request().url()),file=path.join(root,u.pathname.replace(/^\//,''));if(u.pathname.startsWith('/assets/garage/cars/')&&fs.existsSync(file))return r.fulfill({path:file});return r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body></body></html>'});});
 await page.goto('https://garage.test/');
 for(const css of ['app.css','garage.css'])await page.addStyleTag({path:path.join(root,css)});
 for(const js of ['garage-model.js','garage-cars.js','garage-availability.js','garage-time-picker.js','garage.js'])await page.addScriptTag({path:path.join(root,js)});
 const start=async admin=>{await page.evaluate(data=>{SatoriGarage.reset();window.testSnapshot=data;SatoriGarage.configure({getSession:()=>({username:'fixture-user',name:'Testovací používateľ',role:data.me.role,session_token:'t'}),getLineTargets:()=>[{line:'garage',label:'Garáž',active:true}],loadUsers:async()=>({ok:true,users:data.members.map(m=>({...m,sourceLine:'gp',sourceRole:'office',access:true}))}),transport:async()=>structuredClone(window.testSnapshot)});SatoriGarage.open();},fixture(admin));await page.waitForSelector('#garage-day-overview');};
 // 1) Five tabs (admin) stay in one row, at any phone width, and nothing hides behind the bar.
 await start(true);
 for(const width of [390,320]){await page.setViewportSize({width,height:844});
  const geo=await page.evaluate(()=>{const b=[...document.querySelectorAll('.garage-tabs button')].map(x=>x.getBoundingClientRect()),bar=document.querySelector('.garage-tabs').getBoundingClientRect();return {count:b.length,tops:b.map(x=>Math.round(x.top)),height:bar.height,right:Math.max(...b.map(x=>x.right)),bottomGap:innerHeight-bar.bottom};});
  assert.equal(geo.count,5,'Admin sees the Správa tab');assert.equal(new Set(geo.tops).size,1,'All five tabs share one row at '+width);assert.ok(geo.height<84,'Bar stays compact at '+width);assert.ok(geo.right<=width+1,'No tab sticks out at '+width);assert.ok(Math.abs(geo.bottomGap)<1.5);
  await page.locator('#satori-garage').evaluate(el=>{el.scrollTop=el.scrollHeight;});assert.equal(await page.evaluate(()=>{const t=document.querySelector('.garage-tabs').getBoundingClientRect().top,last=[...document.querySelectorAll('#garage-content > *')].pop().getBoundingClientRect().bottom;return last<=t+1;}),true,'Last card is reachable at '+width);}
 await page.setViewportSize({width:390,height:844});
 // 2) The bar steps aside while typing so it never sits on the on-screen keyboard.
 await page.locator('.garage-tabs [data-garage-view="admin"]').click();await page.waitForSelector('#garage-user-search');
 assert.equal(await page.locator('.garage-tabs').isVisible(),true);await page.locator('#garage-user-search').focus();assert.equal(await page.locator('.garage-tabs').isVisible(),false,'Tab bar hides while a text field has focus');
 await page.locator('#garage-user-search').blur();assert.equal(await page.locator('.garage-tabs').isVisible(),true,'Tab bar returns after typing');
 // 3) Four-digit place numbers fit their plates.
 await page.locator('.garage-tabs [data-garage-view="planning"]').click();
 const fit=await page.evaluate(()=>[...document.querySelectorAll('.garage-ticket-number,.garage-mini-plate strong')].map(n=>({text:n.textContent,fits:n.scrollWidth<=n.parentElement.clientWidth+1})));
 assert.ok(fit.length>=1&&fit.every(x=>x.fits),'Plates fit: '+JSON.stringify(fit));assert.equal(await page.locator('.garage-ticket-number').innerText(),'1230');
 await page.locator('.garage-tabs [data-garage-view="reservations"]').click();const fit2=await page.evaluate(()=>[...document.querySelectorAll('.garage-mini-plate strong')].map(n=>n.scrollWidth<=n.parentElement.clientWidth+1));assert.ok(fit2.length&&fit2.every(Boolean),'My days plates fit');
 // 4) Planning shows incoming offers in the same card style as the Offers screen.
 await page.locator('.garage-tabs [data-garage-view="planning"]').click();
 assert.equal(await page.locator('#garage-incoming-offers .garage-offer.incoming').count(),1);assert.equal(await page.locator('#garage-incoming-offers .garage-mini-plate strong').innerText(),'1231');assert.equal(await page.locator('#garage-incoming-offers [data-response="accept"]').count(),1);assert.match(await page.locator('#garage-incoming-offers').innerText(),/Eva Starostová/);
 // 5) Editing a day from My days keeps an unsent multi-day selection.
 await start(false);
 await page.locator('[data-garage-action="attendance-open"]').click();await page.waitForSelector('#garage-attendance-form');
 await page.locator('[data-garage-pick="2026-10-23"]').click();await page.locator('[data-garage-pick="2026-10-24"]').click();assert.equal(await page.locator('[data-garage-unpick]').count(),3);
 await page.locator('[data-garage-dialog-close]').click();await page.waitForSelector('#garage-attendance-form',{state:'detached'});assert.match(await page.locator('[data-garage-action="attendance-open"]').innerText(),/\(3\)/,'Draft of three days is kept');
 await page.locator('.garage-tabs [data-garage-view="reservations"]').click();await page.locator('[data-garage-day-edit="2026-10-19"]').click();await page.waitForSelector('#garage-attendance-form');
 assert.equal(await page.locator('[data-garage-unpick]').count(),1,'Editing a day shows just that day');assert.match(await page.locator('.garage-selected-dates').innerText(),/19\. októbra/);
 await page.locator('[data-garage-dialog-close]').click();await page.waitForSelector('#garage-attendance-form',{state:'detached'});
 await page.locator('.garage-tabs [data-garage-view="planning"]').click();assert.match(await page.locator('[data-garage-action="attendance-open"]').innerText(),/\(3\)/,'The unsent selection is back after the edit');
 await page.evaluate(()=>{window.__saved=[];SatoriGarage.configure({transport:async(action,payload)=>{if(action==='getGarage')return structuredClone(window.testSnapshot);const s=window.testSnapshot,p=payload.payload;window.__saved.push(p.dates);for(const d of p.dates){s.attendance=s.attendance.filter(a=>a.date!==d);s.attendance.push({date:d,owner:'fixture-user',name:'Testovací používateľ',start:p.start,end:p.end});}s.version++;return {ok:true,snapshot:structuredClone(s),result:{days:p.dates.map(date=>({date,status:'reserved',spaceId:'b3-1'}))}};}});});
 await page.locator('.garage-tabs [data-garage-view="reservations"]').click();await page.locator('[data-garage-day-edit="2026-10-19"]').click();await page.waitForSelector('#garage-attendance-form');await page.locator('.garage-booking-submit button[type="submit"]').click();await page.waitForSelector('#garage-attendance-form',{state:'detached'});
 assert.deepEqual(await page.evaluate(()=>window.__saved),[['2026-10-19']],'Only the edited day is saved');
 await page.locator('.garage-tabs [data-garage-view="planning"]').click();assert.match(await page.locator('[data-garage-action="attendance-open"]').innerText(),/\(2\)/,'After saving the edited day, the other two draft days remain');
 assert.deepEqual(errors,[]);await browser.close();console.log('Garage hardening: five tabs in one row, keyboard-safe bar, long place numbers, consistent incoming offers and draft kept after Edit day passed');
})().catch(e=>{console.error(e);process.exit(1);});
