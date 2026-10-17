const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
// Preview first: SATORI_APP_DIR=. checks the live root once the change is promoted.
const repo=path.resolve(__dirname,'..'),root=path.resolve(repo,process.env.SATORI_APP_DIR||'nahlad');
const {chromium}=require(process.env.SATORI_PLAYWRIGHT||path.resolve(repo,'../../node_modules/playwright-core'));
const day='2026-10-19';


function member(id,name){return {id,name,role:'office',weeklyDays:3,active:true};}
function fixture(){
 const slots=Array.from({length:8},(_,i)=>({id:'b'+(i<6?3:1)+'-'+(i+1),number:String(588+i),floor:i<6?-3:-1,order:i,active:true,allowedMembers:[]}));
 const att=(date,start,end)=>({date,owner:'fixture-user',name:'Testovací používateľ',start,end}),res=(id,date,spaceId)=>({id,revision:1,date,owner:'fixture-user',name:'Testovací používateľ',spaceId,start:'08:00',end:'16:30'});
 return {ok:true,version:1,serverDate:day,window:{start:day,end:'2026-11-17'},me:{id:'fixture-user',name:'Testovací používateľ',role:'office',weeklyDays:3,canAdmin:false},
  config:{slots,defaultStart:'08:00',defaultEnd:'16:30',workingDays:[1,2,3,4,5]},
  members:[member('fixture-user','Testovací používateľ'),member('eva','Eva Starostová')],
  attendance:[att('2026-10-19','07:30','16:30'),att('2026-10-20','07:30','16:45'),att('2026-10-21','09:00','15:00'),att('2026-10-26','08:00','16:30')],
  reservations:[res('r1','2026-10-19','b3-1'),res('r2','2026-10-26','b3-2')],offers:[],
  waitlist:[{date:'2026-10-21',owner:'fixture-user',start:'09:00',end:'15:00'}],blocks:[],audit:[]};
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.SATORI_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>{const u=new URL(r.request().url()),file=path.join(root,u.pathname.replace(/^\//,''));if(u.pathname.startsWith('/assets/garage/cars/')&&fs.existsSync(file))return r.fulfill({path:file});return r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body></body></html>'});});
 await page.goto('https://garage.test/');
 for(const css of ['app.css','garage.css'])await page.addStyleTag({path:path.join(root,css)});
 for(const js of ['garage-model.js','garage-cars.js','garage-availability.js','garage-time-picker.js','garage.js'])await page.addScriptTag({path:path.join(root,js)});
 await page.evaluate(data=>{
  window.testSnapshot=data;
  SatoriGarage.configure({getSession:()=>({username:'fixture-user',name:'Testovací používateľ',role:'office',session_token:'t'}),getLineTargets:()=>[{line:'garage',label:'Garáž',active:true}],registerPush:async()=>true,transport:async()=>structuredClone(window.testSnapshot)});
  SatoriGarage.open();
 },fixture());
 await page.waitForSelector('[data-garage-view="reservations"]');await page.locator('[data-garage-view="reservations"]').click();await page.waitForSelector('.garage-mydays');
 const text=sel=>page.locator(sel).innerText(),row=d=>page.locator('[data-garage-day-row="'+d+'"]');
 // Weeks and day rows.
 assert.deepEqual(await page.locator('.garage-week-head h3').allInnerTexts().then(a=>a.map(x=>x.toLowerCase())),['tento týždeň','budúci týždeň']);
 assert.match(await page.locator('.garage-week-head').first().innerText(),/3 \/ 3 dní/,'Week badge counts office days against the weekly goal');assert.match(await text('.garage-mydays > .garage-section-head'),/4 dni/);
 assert.equal(await page.locator('.garage-dayrow').count(),4);
 const today=row('2026-10-19');assert.equal(await today.evaluate(el=>el.classList.contains('today')),true);assert.match(await today.innerText(),/Dnes/);assert.equal(await today.locator('.garage-mini-plate strong').innerText(),'588');
 assert.match(await today.locator('.garage-dayrow-office').innerText(),/V kancelárii · 07:30 – 16:30/);assert.match(await today.innerText(),/Miesto 588[\s\S]*08:00 – 16:30/,'Readable place text stays with the ticket');
 assert.equal(await today.locator('[data-garage-day-edit]').count(),1);assert.equal(await today.locator('[data-garage-offer]').count(),1);assert.equal(await today.locator('[data-garage-day-cancel]').count(),1);assert.equal(await today.locator('#garage-parking-details-2026-10-19 [data-garage-edit]').count(),1);assert.equal(await today.locator('#garage-parking-details-2026-10-19 [data-garage-cancel]').count(),1);
 const none=row('2026-10-20');assert.match(await none.innerText(),/Bez parkovania/);assert.equal(await none.locator('[data-garage-offer]').count(),0,'No place, nothing to offer');assert.equal(await none.locator('.garage-mini-plate').count(),0);
 const wait=row('2026-10-21');assert.equal(await wait.evaluate(el=>el.classList.contains('waiting')),true);assert.match(await wait.innerText(),/Čakáte na voľné miesto · 09:00 – 15:00/);
 assert.match(await row('2026-10-26').innerText(),/Miesto 589/);assert.equal(await page.locator('#garage-week-details').count(),1,'Weekly plan is still available');
 // Editing a day opens the arrival form prefilled with that day and its times.
 await none.locator('[data-garage-day-edit]').click();await page.waitForSelector('#garage-attendance-form');
 assert.match(await text('.garage-selected-dates'),/20\. októbra/);assert.match(await page.locator('[data-garage-time="garage-office-start"]').innerText(),/07:30/);assert.match(await page.locator('[data-garage-time="garage-office-end"]').innerText(),/16:45/);
 await page.locator('[data-garage-dialog-close]').click();await page.waitForSelector('#garage-attendance-form',{state:'detached'});
 await none.locator('[data-garage-day-cancel]').click();await page.waitForSelector('[data-garage-confirm]');assert.match(await text('#garage-dialog'),/Zrušiť príchod\?/);await page.locator('[data-garage-dialog-close]').first().click();
 for(const width of [390,320]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,'No horizontal page scroll at '+width);}
 await page.setViewportSize({width:390,height:844});
 if(process.env.SHOT){await page.locator('#satori-garage').evaluate(el=>{el.scrollTop=0;});await page.screenshot({path:process.env.SHOT+'-1.png'});await page.locator('[data-garage-day-row="2026-10-21"]').scrollIntoViewIfNeeded();await page.screenshot({path:process.env.SHOT+'-2.png'});}
 // Empty state.
 await page.evaluate(()=>{testSnapshot.attendance=[];testSnapshot.reservations=[];testSnapshot.waitlist=[];testSnapshot.version++;return SatoriGarage.refresh(true);});assert.match(await text('.garage-mydays'),/Zatiaľ nemáte nahlásené dni/);assert.equal(await page.locator('.garage-dayrow').count(),0);
 assert.deepEqual(errors,[]);await browser.close();console.log('Garage My days: week groups, date blocks, office line, parking ticket, waiting state, compact actions, edit-day and empty state passed');
})().catch(e=>{console.error(e);process.exit(1);});
