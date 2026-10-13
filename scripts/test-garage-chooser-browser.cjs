const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');const {chromium}=require(process.env.SATORI_PLAYWRIGHT||path.resolve(root,'../../node_modules/playwright-core'));
const source=fs.readFileSync(path.join(root,'app.js'),'utf8'),version=source.match(/var APP_VERSION = '([^']+)'/)[1];
const endpoints={};for(const line of ['gp','gyn','reagila']){const key=line==='gp'?'SCRIPT_URL':line==='gyn'?'GYN_SCRIPT_URL':'REAGILA_SCRIPT_URL';endpoints[new URL(source.match(new RegExp('var '+key+"\\s*=\\s*'([^']+)'"))[1]).pathname]=line;}
const scenarios=[{name:'all-managers',roles:{gp:'admin',gyn:'gyn manager',reagila:'bum'},garage:true,source:'gp'},...['gp','gyn','reagila'].map(line=>({name:'single-'+line,roles:{[line]:line==='gyn'?'gyn am west':'am west'},garage:true,source:line})),{name:'member-with-two-lines',roles:{gp:'rep west',gyn:'rep'},garage:true,source:'gyn',memberLine:'gyn'},{name:'non-member',roles:{gp:'rep west',gyn:'rep'},garage:false}];
scenarios.splice(4,0,{name:'single-member',roles:{gp:'rep west'},garage:true,source:'gp',memberLine:'gp'});
function snap(){const me={id:'chooser.fixture',name:'Testovací používateľ',role:'management',weeklyDays:3,canAdmin:true,vehicle:{brand:'Toyota RAV4',color:'#2563eb'}};return {ok:true,version:1,serverDate:'2026-10-13',window:{start:'2026-10-13',end:'2026-11-11'},me,members:[me],config:{slots:Array.from({length:8},(_,i)=>({id:'space-'+(i+1),number:String(i+1),floor:i<6?-3:-1,order:i,active:true})),defaultStart:'08:00',defaultEnd:'16:30',workingDays:[1,2,3,4,5]},attendance:[],reservations:[],offers:[],waitlist:[],blocks:[],audit:[]};}
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.SATORI_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{for(const prefix of ['','nahlad/'])for(const scenario of scenarios){
 const context=await browser.newContext({viewport:{width:320,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'}),page=await context.newPage(),errors=[],actions=[];
 page.on('pageerror',e=>errors.push(e.message));await context.addInitScript(v=>localStorage.setItem('potencial_gp_version',v),version);
 await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.hostname==='satori.test'){let local=path.join(root,decodeURIComponent(u.pathname).replace(/^\//,'')||'index.html');if(local.endsWith(path.sep))local+='index.html';if(fs.existsSync(local)&&fs.statSync(local).isFile())return route.fulfill({path:local});return route.fulfill({status:404,body:''});}
 if(u.hostname==='script.google.com'){const action=u.searchParams.get('action')||'',line=endpoints[u.pathname];actions.push({action,line,source:u.searchParams.get('garage_source_line')});let reply={ok:true,reps:[],repList:[],history:[],events:[],data:[],rows:[],products:[],stats:{},milestoneStats:{}};
  if(action==='login')reply=scenario.roles[line]?{ok:true,name:'Testovací používateľ',role:scenario.roles[line],session_token:'fixture-'+line,device_id:'fixture-device'}:{ok:false,error:'No account'};
  if(action==='getGarage'){const src=u.searchParams.get('garage_source_line');reply=!scenario.garage||(scenario.memberLine&&src!==scenario.memberLine)?{ok:false,code:'NOT_MEMBER',error:'Nemáte aktívny prístup do Garáže.'}:snap();}
  return route.fulfill({contentType:'application/json',body:JSON.stringify(reply)});
 }return route.fulfill({body:'',contentType:'text/plain'});});
 await page.goto('https://satori.test/'+prefix+'index.html');await page.locator('#login-user').fill('chooser.fixture');await page.locator('#login-pass').fill('fixture-password');await page.locator('#login-btn').click();
 await page.waitForSelector('#line-chooser-screen.show',{timeout:2000});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1),'only the chooser may be visible before choosing an interface');
 if(!scenario.garage){await page.waitForTimeout(300);assert.equal(await page.locator('#line-choose-garage').count(),0);await context.close();continue;}
 await page.waitForSelector('#line-choose-garage');assert.match(await page.locator('#line-choose-garage').innerText(),/Garáž.*Parkovanie a kancelária/s);
 if(scenario.name==='all-managers'&&!prefix){fs.mkdirSync(path.join(root,'.tmp'),{recursive:true});await page.screenshot({path:path.join(root,'.tmp','garage-login-2.90.1.png')});}
 await page.locator('#line-remember-cb').check();const before=actions.length;await page.locator('#line-choose-garage').click();await page.waitForSelector('[data-garage-space]');
 assert.equal(await page.evaluate(()=>getSession().line||'gp'),scenario.source);assert.equal(await page.evaluate(()=>getSession().garage_start),true);
 assert.equal(await page.evaluate(()=>localStorage.getItem('line_pref_chooser.fixture')),'garage');
 assert.deepEqual(actions.slice(before).filter(a=>/^(getInitData|getPlnenie|getPharma|getLekarne|getNastenka|getCalEvents|getAllHistory)/.test(a.action)),[],'direct Garage entry must not load medical data');
 const profile=await page.locator('[data-garage-view="profile"]').boundingBox(),tabs=await page.locator('.garage-tabs').boundingBox();assert.ok(profile.x>=tabs.x&&profile.x+profile.width<=tabs.x+tabs.width+1,'Moje auto must be visible without horizontal scrolling at 320px');
 await page.locator('[data-garage-view="profile"]').click();await page.waitForSelector('#garage-profile-form');assert.ok(await page.getByRole('button',{name:'Uložiť moje auto',exact:true}).isVisible());
 if(scenario.name==='all-managers'&&!prefix)await page.screenshot({path:path.join(root,'.tmp','garage-profile-2.90.1.png')});
 const count=actions.length;await page.reload();await page.waitForSelector('[data-garage-space]');assert.deepEqual(actions.slice(count).filter(a=>/^(getInitData|getPlnenie|getPharma|getLekarne|getNastenka|getCalEvents|getAllHistory)/.test(a.action)),[],'restored Garage session must not load medical data');
 await page.getByRole('button',{name:'Menu Garáže'}).click();await page.locator('#viac-body .viac-line').filter({hasText:{gp:'Golem',gyn:'Gynekológia',reagila:'Reagila'}[scenario.source]}).click();await page.waitForFunction(()=>!document.getElementById('satori-garage'));await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>getSession().garage_start),undefined);assert.ok(actions.slice(count).some(a=>/getInitData|getPlnenie|getRepList|getCalEvents|getAllHistory/.test(a.action)),'return resumes the real medical bootstrap');
 assert.deepEqual(errors,[],scenario.name+' '+prefix);await context.close();console.log(prefix+scenario.name+' passed');
}console.log('Garage login: live/preview role choices, member discovery, remembered entry, restored sessions, back and 320px profile visibility passed');}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
