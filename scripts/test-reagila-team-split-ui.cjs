const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function take(src,name){const start=src.indexOf('function '+name+'(');assert.ok(start>=0,'Missing '+name);const end=src.indexOf('\nfunction ',start+1);return src.slice(start,end<0?undefined:end).split('\n//')[0];}
for(const file of ['app.js','nahlad/app.js']){
 const src=fs.readFileSync(file,'utf8');let s={username:'west-am',role:'am west',line:'reagila',reagila_team_split:true},saved=0;const toggles={};
 const c={console,USERS_LOCAL:{'m.sibert':{region:'BA'},'z.bernatova':{region:'SE'},'l.hricova':{region:'ST'},'p.papcun':{region:'VY'}},MGR_STATE:{role:'amwest'},RPT_VIEW:{scope:'west',username:'m.sibert'},MGR_AM_WEST:['m.sibert','z.bernatova'],MGR_AM_EAST:['l.hricova','p.papcun'],MGR_ALL:['m.sibert','z.bernatova','l.hricova','p.papcun'],APP_ROSTER_CACHE_PREFIX:'roster|',getSession:()=>s,setSession:u=>{s=u;saved++;},document:{body:{classList:{toggle:(k,v)=>toggles[k]=v}}},rp2Name_:u=>u,rp2GynTeam_:()=>'',MGR_ROLE_CFG:{amwest:{reps:['old-golem']},ameast:{reps:['old-golem']}}};vm.createContext(c);
 vm.runInContext([take(src,'rptViewAllowedScopes'),take(src,'rp2Line'),take(src,'reagilaTeamSplitEnabled')].join('\n'),c);
 assert.deepEqual(Array.from(c.rptViewAllowedScopes(),x=>x[0]),['rep','west'],'Active Reagila AM West cannot select full line');
 vm.runInContext(['reagilaTeamSplitEnabled','reagilaTeamClassSync','reagilaLoginTeamExtras','reagilaSyncTeamCapability','plnenieGetActiveReps','rp2ActiveReps_','rptViewScopeReps','rptViewScopeSub','appRosterCacheKey'].map(n=>take(src,n)).join('\n'),c);
 for(const [role,allowed,reps] of [['amwest',['rep','west'],['m.sibert','z.bernatova']],['ameast',['rep','east'],['l.hricova','p.papcun']],['admin',['rep','west','east','sk'],c.MGR_ALL],['boss',['rep','west','east','sk'],c.MGR_ALL],['bum',['rep','west','east','sk'],c.MGR_ALL],['pm',['rep','west','east','sk'],c.MGR_ALL]]){
  c.MGR_STATE.role=role;assert.deepEqual(Array.from(c.rptViewAllowedScopes(),x=>x[0]),allowed);assert.deepEqual(Array.from(c.rp2ActiveReps_()),reps);
 }
 c.MGR_STATE.role='amwest';c.RPT_VIEW.scope='east';assert.equal(c.rptViewScopeReps().length,0,'Even a stale/forged report scope cannot select other team');c.RPT_VIEW.scope='rep';c.RPT_VIEW.username='p.papcun';assert.equal(c.rptViewScopeReps().length,0);
 c.RPT_VIEW.username='m.sibert';assert.match(c.rptViewScopeSub([],{}),/BA.*West/);c.RPT_VIEW.scope='west';assert.deepEqual(Array.from(c.rptViewScopeReps()),c.MGR_AM_WEST);
 const activeKey=c.appRosterCacheKey();s.reagila_team_split=false;assert.notEqual(c.appRosterCacheKey(),activeKey,'Legacy and split roster caches remain separate');assert.deepEqual(Array.from(c.rptViewAllowedScopes(),x=>x[0]),['rep','sk']);
 c.reagilaSyncTeamCapability({team_split_enabled:true,tim:'WEST'});assert.equal(s.reagila_team_split,true);assert.equal(s.tim,'west');assert.equal(saved,1);assert.equal(toggles['reagila-team-split'],true);c.reagilaSyncTeamCapability({});assert.equal(saved,1);
 c.reagilaLoginTeamExtras(s,{team_split_enabled:false,reagila_team_split:true});assert.equal(s.reagila_team_split,false,'Explicit server disabled beats stale local extras');
 s={line:'gp',username:'golem',role:'am west'};c.MGR_STATE.role='amwest';assert.deepEqual(Array.from(c.rptViewAllowedScopes(),x=>x[0]),['rep','west']);c.reagilaSyncTeamCapability({team_split_enabled:true});assert.equal(s.reagila_team_split,undefined);c.reagilaTeamClassSync();assert.equal(toggles['reagila-team-split'],false);
 assert.match(take(src,'reagilaClearGolemStatics'),/'amwest','ameast'/,'New team AM must not keep Golem representatives at line entry');
 for(const fn of ['loadRepList','loadManagerInitData','loadInitData'])assert.match(take(src,fn),/reagilaSyncTeamCapability\(data\)/,fn+' applies server capability only in its guarded response');
 console.log(file+': staged/active Reagila scopes,4 KAM/2 AM/full management,forged report context,cache separation,server extras,line isolation and entry clearing passed');
}
