const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
// Preview first: SATORI_APP_DIR=. checks the live root once the change is promoted.
const repo=path.resolve(__dirname,'..'),root=path.resolve(repo,process.env.SATORI_APP_DIR||'nahlad');
const {chromium}=require(process.env.SATORI_PLAYWRIGHT||path.resolve(repo,'../../node_modules/playwright-core'));
const day='2026-10-19';



function member(id,name){return {id,name,role:'office',weeklyDays:3,active:true};}
function fixture(){
 const slots=Array.from({length:8},(_,i)=>({id:'b'+(i<6?3:1)+'-'+(i+1),number:String(588+i),floor:i<6?-3:-1,order:i,active:true,allowedMembers:[]}));
 return {ok:true,version:1,serverDate:day,window:{start:day,end:'2026-11-17'},me:{id:'fixture-user',name:'Testovací používateľ',role:'office',weeklyDays:3,canAdmin:false},
  config:{slots,defaultStart:'08:00',defaultEnd:'16:30',workingDays:[1,2,3,4,5]},
  members:[member('fixture-user','Testovací používateľ'),member('eva','Eva Starostová')],
  attendance:[],reservations:[{id:'r-eva',revision:1,date:'2026-10-22',owner:'eva',name:'Eva Starostová',spaceId:'b3-2',start:'08:00',end:'16:30'}],
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
 await page.evaluate(data=>{
  window.testSnapshot=data;window.testGate=[];window.testCalls=[];window.testMode='ok';window.release=()=>window.testGate.splice(0).forEach(r=>r());
  SatoriGarage.configure({getSession:()=>({username:'fixture-user',name:'Testovací používateľ',role:'office',session_token:'t'}),getLineTargets:()=>[{line:'garage',label:'Garáž',active:true}],registerPush:async()=>true,
   transport:async(action,payload)=>{
    if(action==='getGarage')return structuredClone(window.testSnapshot);
    window.testCalls.push(payload);await new Promise(r=>window.testGate.push(r));
    if(window.testMode==='fail')return {ok:false,error:'Miesto už nie je voľné.'};
    const s=window.testSnapshot,p=payload.payload;let result={};
    if(payload.command==='attendanceSet'){for(const date of p.dates)s.attendance.push({date,owner:'fixture-user',name:'Testovací používateľ',start:p.start,end:p.end});result={days:p.dates.map(date=>({date,status:'reserved',spaceId:'b3-1'}))};}
    if(payload.command==='waitlistSet')s.waitlist.push({date:p.date,owner:'fixture-user',start:p.start,end:p.end});
    if(payload.command==='offerRespond')s.offers.find(o=>o.id===p.id).status='accepted';
    s.version++;return {ok:true,snapshot:structuredClone(s),result};
   }});
  SatoriGarage.open();
 },fixture());
 await page.waitForSelector('[data-garage-action="attendance-open"]');
 const toast=page.locator('#garage-toast'),held=n=>page.waitForFunction(k=>window.testGate.length>=k,n),release=()=>page.evaluate(()=>window.release());
 // 1) Reporting an arrival: progress while waiting, then success.
 await page.locator('[data-garage-action="attendance-open"]').click();await page.waitForSelector('#garage-attendance-form');
 await page.locator('.garage-booking-submit button[type="submit"]').click();await held(1);
 await page.waitForSelector('#garage-toast.busy');assert.match(await toast.innerText(),/Potvrdzujem príchod a hľadám parkovanie…/);assert.match(await toast.innerText(),/Počkajte, prosím/);assert.equal(await toast.locator('.garage-toast-spin').count(),1);
 assert.equal(await page.locator('.garage-booking-submit button[type="submit"]').getAttribute('aria-busy'),'true','The pressed button shows it is working');assert.equal(await page.locator('.garage-booking-submit button[type="submit"]').isDisabled(),true,'No double submit while waiting');
 if(process.env.SHOT)await page.screenshot({path:process.env.SHOT+'-busy.png'});
 const box=await toast.boundingBox();assert.ok(box.y<80,'Banner sits at the top, never over the bottom buttons');
 await release();await page.waitForSelector('#garage-toast.success');assert.match(await toast.innerText(),/Príchod aj parkovanie potvrdené/);assert.equal(await page.locator('#garage-attendance-form').count(),0,'Dialog closes on success');
 await page.waitForSelector('#garage-toast[hidden]',{state:'attached',timeout:7000});
 // 2) A failure keeps the form, explains and offers a retry that reuses the same command id.
 await page.locator('[data-garage-date="2026-10-20"]').click();await page.locator('[data-garage-action="attendance-open"]').click();await page.waitForSelector('#garage-attendance-form');
 await page.evaluate(()=>{window.testMode='fail';});await page.locator('.garage-booking-submit button[type="submit"]').click();await held(1);await release();
 await page.waitForSelector('#garage-toast.error');if(process.env.SHOT)await page.screenshot({path:process.env.SHOT+'-error.png'});assert.match(await toast.innerText(),/Miesto už nie je voľné\./);assert.match(await toast.innerText(),/Skúste to znova/);assert.equal(await toast.locator('[data-garage-toast-retry]').count(),1);
 assert.equal(await page.locator('#garage-attendance-form').count(),1,'The form stays open after a failure');assert.equal(await page.locator('.garage-booking-submit button[type="submit"]').isDisabled(),false,'Saving can be retried');
 await page.evaluate(()=>{window.testMode='ok';});await toast.locator('[data-garage-toast-retry]').click();await held(1);await page.waitForSelector('#garage-toast.busy');await release();await page.waitForSelector('#garage-toast.success');
 const ids=await page.evaluate(()=>window.testCalls.map(c=>c.commandId));assert.equal(ids[1],ids[2],'Retry repeats the same command, so nothing is saved twice');assert.notEqual(ids[0],ids[1]);
 // 3) Waitlist (no dialog involved).
 await page.locator('[data-garage-date="2026-10-21"]').click();await page.locator('[data-garage-action="waitlist"]').click();await held(1);
 await page.waitForSelector('#garage-toast.busy');assert.match(await toast.innerText(),/Zaraďujem vás na čakaciu listinu…/);assert.equal(await page.locator('[data-garage-action="waitlist"]').getAttribute('aria-busy'),'true');
 await release();await page.waitForSelector('#garage-toast.success');assert.match(await toast.innerText(),/Ste na čakacej listine/);
 // 4) Accepting an offer.
 await page.locator('.garage-tabs [data-garage-view="offers"]').click();await page.locator('[data-response="accept"]').first().click();await page.locator('[data-garage-confirm]').click();await held(1);
 await page.waitForSelector('#garage-toast.busy');assert.match(await toast.innerText(),/Prijímam ponuku…/);assert.equal(await page.locator('[data-garage-confirm]').getAttribute('aria-busy'),'true');
 await release();await page.waitForSelector('#garage-toast.success');assert.match(await page.locator('#garage-content').innerText(),/Prijatá/);
 // 5) The banner never outlives the screen.
 await page.evaluate(()=>SatoriGarage.close());assert.equal(await page.locator('#garage-toast').count(),0);
 assert.deepEqual(errors,[]);await browser.close();console.log('Garage write feedback: progress banner, busy button, success, failure with same-command retry, waitlist, offer acceptance and cleanup passed');
})().catch(e=>{console.error(e);process.exit(1);});
