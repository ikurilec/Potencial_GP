const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
// Preview first: SATORI_APP_DIR=. checks the live root once the change is promoted.
const repo=path.resolve(__dirname,'..'),root=path.resolve(repo,process.env.SATORI_APP_DIR||'nahlad');
const {chromium}=require(process.env.SATORI_PLAYWRIGHT||path.resolve(repo,'../../node_modules/playwright-core'));
const day='2026-10-12',D1='2026-10-20',D2='2026-10-21';

function member(id,name){return {id,name,role:'office',weeklyDays:3,active:true};}
function fixture(){
 const slots=Array.from({length:8},(_,i)=>({id:'b'+(i<6?3:1)+'-'+(i+1),number:String(588+i),floor:i<6?-3:-1,order:i,active:true,allowedMembers:[]}));
 const res=(id,owner,name,spaceId,date)=>({id,revision:1,date,owner,name,spaceId,start:'08:00',end:'16:30'});
 const soon=ms=>new Date(Date.now()+ms).toISOString();
 return {ok:true,version:1,serverDate:day,window:{start:day,end:'2026-11-10'},me:{id:'fixture-user',name:'Testovací používateľ',role:'office',weeklyDays:3,canAdmin:false},
  config:{slots,defaultStart:'08:00',defaultEnd:'16:30',workingDays:[1,2,3,4,5]},
  members:[member('fixture-user','Testovací používateľ'),member('eva','Eva Starostová'),member('ladislav','Ladislav Nazarej'),member('peter','Peter Holanský')],
  attendance:[],
  reservations:[res('r-mine','fixture-user','Testovací používateľ','b3-1',D1),res('r-mine2','fixture-user','Testovací používateľ','b3-5',D2),res('r-eva','eva','Eva Starostová','b3-2',D1),res('r-lad','ladislav','Ladislav Nazarej','b3-3',D1),res('r-peter','peter','Peter Holanský','b3-4',D1)],
  offers:[
   {id:'o-in-transfer',type:'transfer',from:'eva',to:'fixture-user',fromReservationId:'r-eva',status:'pending',expiresAt:soon(2*86400000+3600000)},
   {id:'o-in-swap',type:'swap',from:'ladislav',to:'fixture-user',fromReservationId:'r-lad',toReservationId:'r-mine',status:'pending',expiresAt:soon(5*3600000)},
   {id:'o-out-transfer',type:'transfer',from:'fixture-user',to:'peter',fromReservationId:'r-mine2',status:'pending',expiresAt:soon(3*3600000)},
   {id:'o-done-swap',type:'swap',from:'fixture-user',to:'peter',fromReservationId:'r-mine',toReservationId:'r-peter',status:'accepted',expiresAt:'2026-10-13T10:12:35Z'},
   {id:'o-cancelled',type:'transfer',from:'fixture-user',to:'eva',fromReservationId:'gone',status:'cancelled',expiresAt:'2026-10-20T18:12:35Z'},
   {id:'o-expired',type:'transfer',from:'peter',to:'fixture-user',fromReservationId:'r-peter',status:'expired',expiresAt:'2026-10-11T08:00:00Z'}],
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
  window.testSnapshot=data;
  SatoriGarage.configure({getSession:()=>({username:'fixture-user',name:'Testovací používateľ',role:'office',session_token:'t'}),getLineTargets:()=>[{line:'garage',label:'Garáž',active:true}],registerPush:async()=>true,transport:async()=>structuredClone(window.testSnapshot)});
  SatoriGarage.open({view:'offers'});
 },fixture());
 await page.waitForSelector('#garage-offers-incoming');
 const text=sel=>page.locator(sel).innerText();
 // Groups: what needs me first, then what I wait for, history folded away.
 const order=await page.locator('#garage-content > *').evaluateAll(els=>els.map(e=>e.id||e.className.split(' ').find(c=>/notify|clear/.test(c))||''));
 assert.deepEqual(order.filter(Boolean),['garage-offers-incoming','garage-offers-outgoing','garage-offers-history','garage-notify-strip']);
 assert.match(await text('#garage-offers-incoming h2'),/Čaká na teba/);assert.equal(await page.locator('#garage-offers-incoming .garage-offer').count(),2);
 assert.equal(await page.locator('#garage-offers-incoming [data-response="accept"]').count(),2);assert.equal(await page.locator('#garage-offers-incoming [data-response="decline"]').count(),2);
 assert.equal(await page.locator('#garage-offers-outgoing [data-response="cancel"]').count(),1,'Own pending offer can be withdrawn');assert.equal(await page.locator('#garage-offers-outgoing [data-response="accept"]').count(),0);
 assert.equal(await page.locator('#garage-offers-history').evaluate(el=>el.open),false,'History is folded while something is active');assert.match(await text('#garage-offers-history summary'),/História \(3\)/);
 // Mini tickets show the place numbers; a swap shows both places side by side.
 const transfer=page.locator('[data-garage-offer-id="o-in-transfer"]');assert.equal(await transfer.locator('.garage-mini-plate strong').innerText(),'589');assert.match(await transfer.innerText(),/Eva Starostová[\s\S]*Prevod[\s\S]*Tebe/);
 const swap=page.locator('[data-garage-offer-id="o-in-swap"]');assert.deepEqual(await swap.locator('.garage-mini-plate strong').allInnerTexts(),['590','588']);assert.match(await swap.innerText(),/Ich miesto[\s\S]*Tvoje miesto/i);assert.match(await swap.innerText(),/Výmena/);
 assert.match(await transfer.innerText(),/Vyprší o 2 dni/);assert.match(await page.locator('[data-garage-offer-id="o-out-transfer"]').innerText(),/Vyprší o 3 h/);assert.doesNotMatch(await text('#garage-content'),/Platnosť do/,'No raw timestamps with seconds');
 assert.match(await transfer.innerText(),/Čaká na prijatie/);
 // History: no noise about missing reservations, no expiry for finished offers.
 await page.locator('#garage-offers-history summary').click();
 const cancelled=page.locator('[data-garage-offer-id="o-cancelled"]');assert.match(await cancelled.innerText(),/Zrušená/);assert.doesNotMatch(await cancelled.innerText(),/nie je dostupn|Vyprší/);assert.equal(await cancelled.locator('.garage-mini-ticket').count(),0);
 assert.match(await page.locator('[data-garage-offer-id="o-done-swap"]').innerText(),/Prijatá/);assert.match(await page.locator('[data-garage-offer-id="o-expired"]').innerText(),/Vypršala/);assert.equal(await page.locator('#garage-offers-history [data-garage-respond]').count(),0,'History has no actions');
 assert.equal(await page.locator('[data-garage-action="notifications"]').count(),1,'Notification switch stays reachable');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,'No horizontal page scroll at phone width');
 if(process.env.SHOT){await page.locator('#satori-garage').evaluate(el=>{el.scrollTop=0;});await page.screenshot({path:process.env.SHOT+'-1.png'});await page.locator('#garage-offers-outgoing').scrollIntoViewIfNeeded();await page.screenshot({path:process.env.SHOT+'-2.png'});}
 // Empty state and "only history" state.
 await page.evaluate(()=>{testSnapshot.offers=testSnapshot.offers.filter(o=>o.status!=='pending');testSnapshot.version++;return SatoriGarage.refresh(true);});
 assert.equal(await page.locator('#garage-offers-incoming, #garage-offers-outgoing').count(),0);assert.match(await text('.garage-offers-clear'),/Nič nečaká na vyriešenie/);assert.equal(await page.locator('#garage-offers-history').evaluate(el=>el.open),true,'History opens when nothing else is active');
 await page.evaluate(()=>{testSnapshot.offers=[];testSnapshot.version++;return SatoriGarage.refresh(true);});assert.match(await text('#garage-content'),/Nič nečaká/);assert.equal(await page.locator('[data-garage-view="reservations"].garage-button').count(),1);
 assert.deepEqual(errors,[]);await browser.close();console.log('Garage offers screen: groups, mini tickets, state colours, folded history, expiry wording and empty states passed');
})().catch(e=>{console.error(e);process.exit(1);});
