const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function take(src,name){const start=src.indexOf('function '+name+'(');assert.ok(start>=0,'Missing '+name);const end=src.indexOf('\nfunction ',start+1);return src.slice(start,end<0?undefined:end).split('\n//')[0];}
(async()=>{for(const file of ['app.js','nahlad/app.js']){
 const src=fs.readFileSync(file,'utf8');let owner='reagila|admin|admin',epoch=1,line='reagila',fetches=0,complete;const storage={avatar_cfg_l_faber:'old'};
 const c={console,Promise,Date,USAGE_VIEW:{line:'gp'},USAGE_MANAGER_PROFILES:null,MGR_STATE:{role:'admin',managers:[]},MGR_REP_NAMES:{},USERS_LOCAL:{'l.faber':{name:'Lenka Fáber'}},LB_REP_INFO:{},GYN_STATE:{repList:[],userList:[]},AVATAR_SCHEMAS:{adventurer:{}},IS_DEV:false,
  document:{querySelectorAll:()=>[]},usageBody:()=>null,getSession:()=>({username:'admin',line,role:'admin'}),appReadOwner:()=>owner,appLineTag:()=>line,appLineCapture:()=>({line,epoch}),appLineContextActive:x=>x.line===line&&x.epoch===epoch,
  scriptUrl:x=>x,mgrFetchWithRetry:()=>{fetches++;return new Promise(r=>{complete=r;});},localStorage:{setItem:(k,v)=>storage[k]=v,removeItem:k=>delete storage[k]},avatarRefreshAllInDom:()=>{}};
 vm.createContext(c);vm.runInContext(take(src,'usageRepName'),c);
 assert.equal(c.usageRepName(' L.FABER '),'Lenka Fáber','Use current roster and normalize login, never show its spelling as the name');
 c.MGR_STATE.managers=[{username:'l.faber',name:'Lenka Fáberová'}];c.MGR_REP_NAMES['l.faber']='Old name';assert.equal(c.usageRepName('l.faber'),'Lenka Fáberová','Current manager profile wins over stale fallback');
 c.USAGE_VIEW.line='gyn';c.GYN_STATE.userList=[{login:' L.FABER ',meno:'Lenka v GYN'}];assert.equal(c.usageRepName('l.faber'),'Lenka v GYN');c.USAGE_VIEW.line='gp';
 vm.runInContext([take(src,'usageApplyManagers'),take(src,'usageLoadManagers'),take(src,'usageRefreshIdentityDom')].join('\n'),c);
 c.MGR_STATE.managers=[];const first=c.usageLoadManagers(),joined=c.usageLoadManagers();assert.equal(fetches,1,'Concurrent activity/manager loads share a request');
 complete([{username:' L.FABER ',name:'Lenka Fáber',role:'am east',avatar:JSON.stringify({style:'adventurer',hair:'long01'})},{username:'e.starostova',name:'Eva Starostová',role:'bum',avatar:''}]);await first;await joined;
 assert.equal(c.MGR_STATE.managers[0].username,'l.faber');assert.equal(c.usageRepName('e.starostova'),'Eva Starostová');assert.ok(storage['avatar_cfg_l.faber']);
 await c.usageLoadManagers();assert.equal(fetches,1,'Warm profiles do not refetch');
 const retry=c.usageLoadManagers(true);storage['avatar_cfg_l.faber']='stale';complete([{username:'l.faber',name:'Lenka Fáber',role:'am east',avatar:''}]);await retry;assert.equal(storage['avatar_cfg_l.faber'],undefined,'Authoritative missing avatar clears cached image');
 const fetcher=c.mgrFetchWithRetry;c.mgrFetchWithRetry=()=>Promise.reject(Error('offline'));await c.usageLoadManagers(true);assert.equal(c.usageRepName('l.faber'),'Lenka Fáber','Failed refresh keeps known names');c.mgrFetchWithRetry=fetcher;
 const stale=c.usageLoadManagers(true);epoch++;line='gp';owner='gp|other|admin';c.MGR_STATE.managers=[];complete([{username:'secret',name:'Previous line',avatar:''}]);await stale;assert.equal(c.MGR_STATE.managers.length,0,'Late old account/line response cannot change profiles');
 line='gyn';await c.usageLoadManagers(true);assert.equal(fetches,3,'GYN uses its own user roster without calling GP');
 assert.match(take(src,'usageStatsLoad'),/usageLoadManagers\(/,'Activity loads manager identities independently of visits');
 assert.match(take(src,'mgrLoadReps'),/usageLoadManagers\(/,'Initial manager metadata uses the same shared loader');
 assert.match(take(src,'avatarRefreshAllInDom'),/usageRefreshIdentityDom\(/,'Late representative/user data updates activity names and images');
 console.log(file+': normalized full names,manager/current-line priority,shared independent profile loading,cache reuse,avatar removal and late account/line isolation passed');
}})().catch(e=>{console.error(e);process.exit(1);});
