const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
for(const file of ['app.js','nahlad/app.js']){
 const source=fs.readFileSync(path.join(root,file),'utf8');
 const canon=source.slice(source.indexOf('function usageCanonSection('),source.indexOf('// Poskladaj pole'));
 const tracking=source.slice(source.indexOf('function usageTrack('),source.indexOf('// Golem rep úvodná'));
 const detect=source.slice(source.indexOf('var USAGE_PANEL_SECTIONS ='),source.indexOf('// Koniec relácie —'));
 const lifecycle=source.slice(source.indexOf('function usageMarkClose('),source.indexOf('// Flush + uzavretie sekcie'));const clearing=source.slice(source.indexOf('function clearSession()'),source.indexOf('// ═══ ADMIN PREPÍNAČ LÍNIE'));
 const listeners={},elements={},classes=new Set();let clock=Date.parse('2026-10-14T10:00:00Z');
 class Clock extends Date{constructor(...args){super(...(args.length?args:[clock]));}static now(){return clock;}}
 const context={console,Date:Clock,JSON,Math,isFinite,setTimeout:()=>1,clearTimeout(){},setInterval(){},APP_VERSION:'test',IS_DEV:false,
  getSession:()=>context.session,usageDevice:()=> 'test',usageLabelFor:()=> 'Obnoviť',SESSION_KEY:'session',MGR_DUAL_KEY:'dual',localStorage:{setItem(){},removeItem(k){if(k==='session')context.session=null;}},sessionStorage:{removeItem(k){if(k==='session')context.session=null;}},stopNotifPolling(){},getComputedStyle:el=>({display:el.style?.display||'block'}),
  document:{hidden:false,body:{classList:{contains:x=>classes.has(x),remove:(...xs)=>xs.forEach(x=>classes.delete(x))}},getElementById:id=>elements[id]||null,addEventListener:(name,fn)=>(listeners[name]||=[]).push(fn)},
  USAGE:{active:null,buffer:[],FLUSH_AT:999,FLUSH_EVERY:1000,STORAGE_KEY:'test',lastKey:'',lastTs:0},usageFlush(){} };
 context.window=context;vm.createContext(context);vm.runInContext(canon+tracking+detect+lifecycle+clearing,context);
 elements['satori-garage']={style:{display:'block'}};
 // Stale medical overlays remain mounted underneath the Garage and must not win.
 elements['dnes-overlay']={classList:{contains:x=>x==='show'},style:{}};
 elements['pharma-ms-overlay']={classList:{contains:x=>x==='show'},style:{}};
 for(const line of ['gp','gyn','reagila'])for(const role of ['rep west','am west','boss','bum','office','fleet']){
  context.session={username:'fixture',line,role};context.USAGE.active=null;context.USAGE.buffer=[];classes.delete('login-active');
  assert.equal(context.usageDetectScreen().section,'Garáž',file+' '+line+' '+role+' detects top interface');
  assert.equal(context.usageCurrentSection(),'Garáž');
  for(const fn of listeners['satori-garage-open']||[])fn();
  assert.equal(context.USAGE.active?.section,'Garáž','Garage entry starts its own clock immediately');
  const count=context.USAGE.buffer.length;context.usageSyncScreen();context.usageSyncScreen();assert.equal(context.USAGE.buffer.length,count,'Polling must not reopen the same section');
  clock+=3000;for(const fn of listeners.click||[])fn({target:{}});assert.equal(context.USAGE.buffer.at(-1).section,'Garáž');assert.equal(context.USAGE.buffer.at(-1).type,'click');
  delete elements['satori-garage'];for(const fn of listeners['satori-garage-close']||[])fn();
  assert.equal(context.USAGE.buffer.filter(e=>e.type==='section_time'&&e.section==='Garáž').length,1,'Garage exit closes its time exactly once');
  assert.notEqual(context.USAGE.active?.section,'Garáž','Exit resumes the actual medical view');
  elements['satori-garage']={style:{display:'block'}};
 }

 context.SatoriGarageBridge={reset(){delete elements['satori-garage'];for(const fn of listeners['satori-garage-close']||[])fn();}};
 for(const logout of [true,false]){context.document.hidden=false;context.session={username:'fixture',role:'rep west',line:'gp'};context.USAGE.buffer=[];context.USAGE._closedAt=0;context.usageSectionEnter('Garáž');clock+=3000;if(logout)context.usageMarkClose('odhlásil sa');context.clearSession();assert.equal(context.USAGE.buffer.filter(e=>e.type==='section_time'&&e.section==='Garáž').length,1);assert.equal(context.USAGE.buffer.filter(e=>e.type==='section_open'&&e.section!=='Garáž').length,0,'Session teardown must not reopen a retained medical view');assert.equal(context.USAGE.active,null,'Session teardown leaves no active Garage clock');elements['satori-garage']={style:{display:'block'}};}
 context.session={username:'admin',role:'admin',line:'gp'};context.USAGE.buffer=[];for(const fn of listeners['satori-garage-open']||[])fn();assert.equal(context.USAGE.buffer.length,0,'Existing admin analytics exclusion remains');
 classes.add('login-active');assert.equal(context.usageDetectScreen(),null,'Login screen is never Garage usage');classes.delete('login-active');
 context.document.hidden=true;context.USAGE.active=null;context.session={username:'fixture',role:'office',line:'gp'};for(const fn of listeners['satori-garage-open']||[])fn();assert.equal(context.USAGE.active,null,'Background pages do not start a section clock');
 console.log(file+': 18 Garage role/line contexts, medical overlay isolation, immediate entry/exit time, click labels, no timer duplicates and admin/login/background guards passed');
}
