const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');const root=path.resolve(__dirname,'..');
const {chromium}=require(process.env.SATORI_PLAYWRIGHT||path.resolve(root,'../../node_modules/playwright-core'));
const member={id:'office.fixture',name:'Office Test',role:'office',weeklyDays:3,canAdmin:false,vehicle:{brand:'Test auto',color:'#2563eb'}};
const fixture={ok:true,version:1,serverDate:'2026-10-12',window:{start:'2026-10-12',end:'2026-11-10'},me:member,members:[member],config:{slots:Array.from({length:8},(_,i)=>({id:'space-'+(i+1),number:String(i+1),floor:i<6?-3:-1,order:i,active:true})),defaultStart:'08:00',defaultEnd:'16:30',workingDays:[1,2,3,4,5]},attendance:[],reservations:[],offers:[],waitlist:[],blocks:[],audit:[]};
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.SATORI_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{for(const prefix of ['','nahlad/']){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'}),page=await context.newPage(),errors=[],actions=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.addInitScript(version=>{const s={username:'office.fixture',name:'Office Test',role:'office',session_token:'fixture-token',device_id:'fixture-device',loginTime:Date.now(),rememberMe:true};localStorage.setItem('potencial_gp_session',JSON.stringify(s));localStorage.setItem('potencial_gp_version',version);},fs.readFileSync(path.join(root,'app.js'),'utf8').match(/var APP_VERSION = '([^']+)'/)[1]);
  await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.hostname==='satori.test'){const local=path.join(root,decodeURIComponent(u.pathname).replace(/^\//,'')||'index.html');const target=local.endsWith(path.sep)?local+'index.html':local;if(fs.existsSync(target)&&fs.statSync(target).isFile())return route.fulfill({path:target});return route.fulfill({status:404,body:''});}
   if(u.hostname==='script.google.com'){const action=u.searchParams.get('action')||'';actions.push(action);return route.fulfill({contentType:'application/json',body:JSON.stringify(action==='getGarage'?fixture:{ok:true,value:'',reps:[],history:[],events:[]})});}return route.fulfill({body:'',contentType:'text/plain'});
  });
  await page.goto('https://satori.test/'+prefix+'index.html');await page.waitForSelector('#satori-garage');await page.waitForSelector('[data-garage-space]');await page.waitForTimeout(1800);
  assert.equal(await page.evaluate(()=>getSession().role),'office');assert.equal(await page.locator('#login-screen').isVisible(),false);
  const medical=actions.filter(x=>/^(getInitData|getPlnenie|getPharma|getLekarne|getNastenka|getCalEvents|getAllHistory)/.test(x));assert.deepEqual(medical,[],'office login must not request medical data');
  await page.evaluate(()=>appGoDomov());assert.ok(await page.locator('#satori-garage').isVisible());
  const count=actions.filter(x=>x==='getGarage').length;await page.evaluate(()=>appPtrRefreshCurrent(()=>{}));await page.waitForTimeout(200);assert.ok(actions.filter(x=>x==='getGarage').length>count,'pull refresh routes to Garage');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'mobile layout must not overflow');assert.deepEqual(errors,[]);await context.close();
 }
 console.log('Garage: actual live/preview Satori office boot, medical isolation and refresh passed');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
