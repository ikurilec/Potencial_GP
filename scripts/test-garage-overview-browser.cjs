const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
// Preview first: SATORI_APP_DIR=. checks the live root once the change is promoted.
const repo=path.resolve(__dirname,'..'),root=path.resolve(repo,process.env.SATORI_APP_DIR||'nahlad');
const {chromium}=require(process.env.SATORI_PLAYWRIGHT||path.resolve(repo,'../../node_modules/playwright-core'));
const day='2026-10-12';
function member(id,name){return {id,name,role:'office',weeklyDays:3,active:true};}
function fixture(){
 const slots=Array.from({length:8},(_,i)=>({id:'b'+(i<6?3:1)+'-'+(i+1),number:String(i+1),floor:i<6?-3:-1,order:i,active:true,allowedMembers:[]}));
 const full=slots.map((s,i)=>({id:'full-'+i,revision:1,date:'2026-10-14',owner:'other-'+i,name:'Kolega '+i,spaceId:s.id,start:'08:00',end:'16:30',kind:'fleet',creatorName:'Správca',vehicle:{brand:'Škoda Octavia sedan',color:'#ffffff'}}));
 return {ok:true,version:1,serverDate:day,window:{start:day,end:'2026-11-10'},me:{id:'fixture-user',name:'Testovací používateľ',role:'office',weeklyDays:3,canAdmin:false},
  config:{slots,defaultStart:'08:00',defaultEnd:'16:30',workingDays:[1,2,3,4,5]},
  members:[member('fixture-user','Testovací používateľ'),...slots.map((_,i)=>member('other-'+i,'Kolega '+i)),member('anna','Anna Nováková'),member('boris','Boris Kováč'),member('nobody','Bez príchodu'),Object.assign(member('gone','Bývalý kolega'),{access:false})],
  attendance:[{date:'2026-10-13',owner:'anna',name:'Anna Nováková',start:'08:00',end:'16:30'},{date:'2026-10-15',owner:'anna',name:'Anna Nováková',start:'09:00',end:'15:00'},{date:'2026-10-13',owner:'boris',name:'Boris Kováč',start:'08:00',end:'12:00'},{date:'2026-10-13',owner:'gone',name:'Bývalý kolega',start:'08:00',end:'12:00'},{date:'2026-10-16',owner:'fixture-user',name:'Testovací používateľ',start:'08:00',end:'16:30'}],
  reservations:full,offers:[],
  waitlist:[{date:'2026-10-16',owner:'fixture-user',start:'08:00',end:'16:30'},{date:'2026-10-14',owner:'anna',start:'08:00',end:'16:30'},{date:'2026-10-14',owner:'boris',start:'08:00',end:'16:30'},{date:'2026-10-15',owner:'boris',start:'08:00',end:'16:30'}],
  blocks:[],audit:[]};
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.SATORI_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>{const u=new URL(r.request().url()),file=path.join(root,u.pathname.replace(/^\//,''));if(u.pathname.startsWith('/assets/garage/cars/')&&fs.existsSync(file))return r.fulfill({path:file});return r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html><body></body></html>'});});
 await page.goto('https://garage.test/');
 for(const css of ['app.css','garage.css'])await page.addStyleTag({path:path.join(root,css)});
 for(const js of ['garage-model.js','garage-cars.js','garage-availability.js','garage-time-picker.js','garage.js'])await page.addScriptTag({path:path.join(root,js)});
 await page.evaluate(data=>{
  window.testSnapshot=data;
  SatoriGarage.configure({getSession:()=>({username:'fixture-user',name:'Testovací používateľ',role:'office',session_token:'t'}),getLineTargets:()=>[{line:'garage',label:'Garáž',active:true}],transport:async()=>structuredClone(window.testSnapshot)});
  SatoriGarage.open();
 },fixture());
 await page.waitForSelector('#garage-colleague-card');

 // Month overview: occupancy tint follows the capacity chip.
 assert.ok(await page.locator('[data-garage-date="2026-10-14"].cap-full').count(),'A fully booked day is tinted as full');
 assert.ok(await page.locator('[data-garage-date="2026-10-15"].cap-free').count(),'A day with free places is tinted as free');
 assert.match(await page.locator('.garage-capacity-key').innerText(),/Voľno[\s\S]*Málo miest[\s\S]*Plno/);

 // Colleague finder lists only active colleagues who report at least one day.
 const options=await page.locator('#garage-colleague option').allTextContents();
 assert.deepEqual(options,['Vyberte kolegu','Anna Nováková (2)','Boris Kováč (1)'],'Own account, colleagues without arrivals and revoked accounts are not offered');
 assert.equal(await page.locator('.has-colleague').count(),0,'Nothing is highlighted before a colleague is chosen');
 await page.selectOption('#garage-colleague','anna');
 assert.deepEqual(await page.locator('.has-colleague').evaluateAll(els=>els.map(e=>e.dataset.garageDate)),['2026-10-13','2026-10-15']);
 assert.equal(await page.locator('.garage-colleague-day').count(),2);
 assert.match(await page.locator('.garage-colleague-day').first().innerText(),/08:00 – 16:30/);
 assert.match(await page.locator('.garage-selection-legend').innerText(),/Anna Nováková v kancelárii/);
 assert.match(await page.locator('[data-garage-date="2026-10-13"]').getAttribute('aria-label'),/Anna Nováková je v kancelárii/);
 assert.equal(await page.locator('#garage-colleague').inputValue(),'anna','Selection survives a re-render');
 await page.locator('.garage-colleague-day').nth(1).click();
 assert.equal(await page.locator('[data-garage-date="2026-10-15"]').getAttribute('aria-current'),'date','Tapping a colleague day opens that day');
 await page.selectOption('#garage-colleague','');assert.equal(await page.locator('.has-colleague').count(),0);

 // Waitlist visibility: own marker in the calendar and an anonymous count for the viewed day.
 assert.equal(await page.locator('[data-garage-date="2026-10-16"].has-waiting').count(),1);
 assert.match(await page.locator('[data-garage-date="2026-10-16"] i').innerText(),/◷/);
 assert.match(await page.locator('[data-garage-date="2026-10-16"]').getAttribute('aria-label'),/čakáte na voľné miesto/);
 assert.equal(await page.locator('[data-garage-date="2026-10-14"].has-waiting').count(),0,'Other people waiting do not mark my calendar');
 await page.locator('[data-garage-date="2026-10-14"]').click();
 assert.match(await page.locator('.garage-waiting-count').innerText(),/čaká 2 kolegovia/);
 await page.locator('[data-garage-date="2026-10-15"]').click();
 assert.match(await page.locator('.garage-waiting-count').innerText(),/čaká 1 kolega\b/);
 await page.locator('[data-garage-date="2026-10-16"]').click();
 assert.equal(await page.locator('.garage-waiting-count').count(),0,'No count when nobody else waits');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,'No horizontal page scroll at phone width');
 assert.deepEqual(errors,[]);
 await browser.close();console.log('Garage overview, colleague finder and waitlist visibility passed');
})().catch(e=>{console.error(e);process.exit(1);});
