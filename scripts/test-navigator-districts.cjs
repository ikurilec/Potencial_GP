'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
for(const file of ['app.js','nahlad/app.js']){
 const src=fs.readFileSync(file,'utf8');function fn(name){const a=src.indexOf('function '+name+'('),b=src.indexOf('\nfunction ',a+1);assert.ok(a>=0,name);return src.slice(a,b<0?undefined:b);}
 let allowed=['west','east'],mgr=true,line='gp',opened=[];
 const c={console,Array,Object,String,JSON,GS_PHARM_MGR:[],GS:{},GS_DATA:{},USERS_LOCAL:{west:{region:'BAMA'},east:{region:'MI'}},LB_REP_INFO:{},MGR_STATE:{reps:{}},LK_STATE:{cache:{},_rows:[]},_histAllItems:[],
  gsNorm:s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(),gsLine:()=>line,gsIsMgr:()=>mgr,gsSession:()=>({username:'east',region:'MI'}),gsAllowedLogins:()=>allowed,
  gsData:()=>({pharmacies:{},history:{}}),gsRepName:x=>x,gsMgrOpenRepOkresy:(login,district)=>opened.push({login,district}),gsOpenOkresExpanded:district=>opened.push({district}),getSession:()=>({}),mgrDetectRole:()=> 'admin',OKRESY_STATE:{open:true,_districts:[],expandedName:null,reqId:1},okresyRender(){},gsLater(){}
 };vm.createContext(c);vm.runInContext(src.slice(src.indexOf('var REGION_OKRESY ='),src.indexOf('// #reprezentant (región)')),c);c.OKRESY=Object.values(c.REGION_OKRESY).flat();
 vm.runInContext(fn('gsRegionDistricts'),c);
 for(const name of ['gsRepDistricts','gsDistrictRepCandidates'])if(src.includes('function '+name+'('))vm.runInContext(fn(name),c);
 vm.runInContext(fn('gsAllowedDistricts')+'\n'+fn('gsDistricts'),c);
 let entry=c.gsDistricts().find(e=>e.title==='Svidník');assert.ok(entry);entry.run();assert.equal(opened.at(-1).login,'east','Svidník must open MI, never the first BAMA representative');
 for(line of ['gp','reagila'])for(const [region,districts] of Object.entries(c.REGION_OKRESY)){
  c.USERS_LOCAL={wrong:{region:region==='MI'?'BAMA':'MI'},correct:{region}};allowed=['wrong','correct'];
  for(const district of districts){opened=[];entry=c.gsDistricts().find(e=>e.title===district);assert.ok(entry,region+' '+district);entry.run();assert.equal(opened.at(-1).login,'correct',line+' '+district);}
 }
 c.USERS_LOCAL={wrong:{region:'BAMA'},correct:{region:'MI'}};allowed=['wrong'];assert.equal(c.gsDistricts().some(e=>e.title==='Svidník'),false,'Unassigned territory must not get a fabricated route');
 allowed=['correct','second'];c.USERS_LOCAL.second={region:'MI'};const choices=c.gsDistricts().filter(e=>e.title==='Svidník');assert.equal(choices.length,2,'Overlapping territory has explicit representative choices');assert.ok(choices.every(e=>e.sub.includes(e._login)));
 allowed=['wrong','correct'];c.USERS_LOCAL.correct.region='CUSTOM';c.gsData=()=>({pharmacies:{wrong:[{okres:'Svidník'}],correct:[{okres:'Svidník'}]},history:{}});assert.equal(c.gsRepDistricts('wrong').includes('Svidník'),false,'Mapped current territory outranks old/outside pharmacy rows');assert.deepEqual(Array.from(c.gsDistrictRepCandidates('Svidník')),['correct'],'An unmapped territory can use its actual owned source rows');
 vm.runInContext(fn('gsExpandOkresWhenReady'),c);c.OKRESY_STATE._districts=[{name:'Košice II'},{name:'Košice I'}];c.gsExpandOkresWhenReady('Košice I');assert.equal(c.OKRESY_STATE.expandedName,'Košice I','District names must match exactly, not a prefix');
 c.OKRESY_STATE._districts=[];c.gsExpandOkresWhenReady('Svidník');assert.equal(c.OKRESY_STATE.expandedName,'Svidník','Keep the requested district while server data arrives; no short polling deadline');
 const store=new Map();c.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};for(const name of ['gsRecentKey','gsRecent','gsPushRecent'])vm.runInContext(fn(name),c);
 c.gsPushRecent({type:'district',title:'Svidník',_login:'correct'});c.gsPushRecent({type:'district',title:'Svidník',_login:'second'});assert.deepEqual(Array.from(c.gsRecent(),r=>r.login),['second','correct'],'Recents retain the chosen representative when territories overlap');
 console.log(file+': every mapped district in GP/Reagila routes to its actual authorized region; overlap, missing scope, exact name and delayed data passed');
}
