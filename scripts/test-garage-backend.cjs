'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const extensionPath = path.resolve(__dirname, '../apps_script/KOD_GARAZ.txt');
assert.ok(fs.existsSync(extensionPath), 'Private Garage Apps Script extension must exist');
const extension = fs.readFileSync(extensionPath, 'utf8');
const ancestors=[];for(let dir=path.resolve(__dirname,'..');;dir=path.dirname(dir)){ancestors.push(path.join(dir,'apps_script/KOD_GOLEM.txt'));if(path.dirname(dir)===dir)break;}
const primaryPath = process.env.SATORI_GOLEM_BACKEND || ancestors.find(p=>fs.existsSync(p));
assert.ok(primaryPath,'Set SATORI_GOLEM_BACKEND to the private Golem helper file');
let primary = fs.readFileSync(primaryPath, 'utf8');
// Exercise the real installer without writing any private deployment files.
const installer=fs.readFileSync(path.join(__dirname,'install-garage-backend.cjs'),'utf8'),memoryDir=path.resolve(__dirname,'../.tmp/backend-installer-memory');
const files=new Map([[path.join(memoryDir,'KOD_GOLEM.txt'),primary],[extensionPath,extension]]);
vm.runInNewContext(installer,{__dirname,process:{argv:['node','installer',memoryDir]},console:{log(){}},require:name=>name==='node:fs'?{existsSync:p=>files.has(p),readFileSync:p=>{assert.ok(files.has(p),'Installer reads only its fixture');return files.get(p);},writeFileSync:(p,s)=>files.set(p,s),copyFileSync:(a,b)=>files.set(b,files.get(a))}:require(name)});
primary=files.get(path.join(memoryDir,'KOD_GOLEM.txt'));
const primaryInstalled=primary;
vm.runInNewContext(installer,{__dirname,process:{argv:['node','installer',memoryDir]},console:{log(){}},require:name=>name==='node:fs'?{existsSync:p=>files.has(p),readFileSync:p=>files.get(p),writeFileSync:(p,s)=>files.set(p,s),copyFileSync:(a,b)=>files.set(b,files.get(a))}:require(name)});
assert.equal(files.get(path.join(memoryDir,'KOD_GOLEM.txt')),primaryInstalled,'Installer remains idempotent');
function functionSource(name, next) { const start=primary.indexOf('function '+name+'('), end=primary.indexOf('function '+next+'(',start); assert.ok(start>=0&&end>start, name+' real helper located'); return primary.slice(start,end); }
const realAuth = [functionSource('requireToken','pouzValues_').split('var AUTH_SESSION_HOURS')[0],functionSource('pouzValues_','cacheGetText_').split('var CACHE_TTL_SEC')[0],functionSource('authGetSessionsSheet_','authCleanSessions_'),functionSource('authRequireSession_','authLogoutSession_'),functionSource('authGetUser_','authIsGpAdmin_')].join('\n');
const profileStart=primary.indexOf("    if(action === 'setAvatar') {"),profileEnd=primary.indexOf("    if(action === 'getPlnenie') {",profileStart);
assert.ok(profileStart>=0&&profileEnd>profileStart,'Real own-profile endpoint branches located');
const realOwnProfile=functionSource('authIsGpAdmin_','authIsGpAmWest_')+'\nfunction ownProfileEndpoint_(ss,e){var action=e.parameter.action;'+primary.slice(profileStart,profileEnd)+'\nreturn jsonResponse({ok:false});}';
const plain = v => JSON.parse(JSON.stringify(v));
let passed=0,failed=0;
function test(name,fn) { try { fn(); passed++; console.log('PASS '+name); } catch(error) { failed++; console.error('FAIL '+name+'\n'+error.stack); } }
class FakeSheet {
  constructor(name,env,rows=[]) { this.name=name;this.env=env;this.rows=plain(rows);this.reads=0; }
  getLastRow() { let n=this.rows.length;while(n&&!(this.rows[n-1]||[]).some(x=>x!==''&&x!==null&&x!==undefined))n--;return n; }
  getDataRange() { return this.getRange(1,1,Math.max(this.getLastRow(),1),Math.max(1,...this.rows.map(x=>x.length))); }
  setFrozenRows() {} getMaxRows(){return 1000;} getMaxColumns(){return 26;} insertRowsAfter(){} insertColumnsAfter(){}
  getRange(r,c,n=1,k=1) { const sheet=this;return {
    getValues(){sheet.reads++;return Array.from({length:n},(_,i)=>Array.from({length:k},(_,j)=>(sheet.rows[r+i-1]||[])[c+j-1]??''));},
    setValues(values){assert.equal(values.length,n); if(sheet.name==='Garage_State'){assert.equal(sheet.env.locked,true,'Garage state writes need central ScriptLock');if(sheet.env.failWrite)throw Error('write failed');sheet.env.stateWrites++;if(sheet.env.duringWrite){const hook=sheet.env.duringWrite;sheet.env.duringWrite=null;hook();}}
      values.forEach((row,i)=>{assert.equal(row.length,k);sheet.rows[r+i-1]||=[];row.forEach((v,j)=>sheet.rows[r+i-1][c+j-1]=v);});return this;},
    setValue(value){assert.equal(n,1);assert.equal(k,1);sheet.rows[r-1]||=[];sheet.rows[r-1][c-1]=value;return this;}
  }; }
  appendRow(row){this.rows.push(plain(row));} deleteRow(n){this.rows.splice(n-1,1);} clearContents(){this.rows=[];}
}
class FakeSpreadsheet { constructor(id,env){this.id=id;this.env=env;this.sheets={};}getId(){return this.id;}getSheetByName(n){return this.sheets[n]||null;}insertSheet(n){const s=new FakeSheet(n,this.env);this.sheets[n]=s;return s;} }
function setup() {
  const env={locked:false,failWrite:false,failFlush:false,stateWrites:0,flushes:0,cache:{},cacheTtls:{},props:{},sends:[],failPush:false,uuid:0,books:{},lockAttempts:[],triggers:[]};
  for(const line of ['gp','gyn','reagila']){const ss=new FakeSpreadsheet('sheet-'+line,env);env.books[ss.id]=ss;
    const users=[['login','password','name','role'],['admin','not-used','Admin','admin'],['office.a','not-used','Office A','office'],['office.b','not-used','Office B','office'],['rep','not-used','Rep','rep west'],['manager','not-used','Manager',line==='gyn'?'gyn-manager':'am west'],['fleet','not-used','Fleet','fleet']];
    ss.sheets.Pouzivatelia=new FakeSheet('Pouzivatelia',env,users);
    ss.sheets.Sessions=new FakeSheet('Sessions',env,[['username','device_id','token','line','created_at','expires_at','last_seen_at','agent','remembered'],...users.slice(1).map(x=>[x[0],'device','session-'+x[0],line==='gyn'?'gyn':'gp','2026-10-12T07:00:00Z','2099-01-01T00:00:00Z','2026-10-12T07:00:00Z','','1'])]);
  }
  env.props.GARAGE_GYN_SHEET_ID='sheet-gyn';env.props.GARAGE_REAGILA_SHEET_ID='sheet-reagila';
  const fixed='2026-10-12T07:00:00Z';class FixedDate extends Date{constructor(...args){super(...(args.length?args:[env.now||fixed]));}static now(){return Date.parse(env.now||fixed);}}
  function context(){const ctx={Date:FixedDate,console,JSON,Math,Error,API_TOKEN:'test-api',_pouzMemo:null,AUTH_SESSION_REMEMBER_DAYS:30,AUTH_SESSION_HOURS:12,FORCE_FRESH_READ_:false,
    SpreadsheetApp:{openById:id=>{if(!env.books[id])throw Error('no spreadsheet');return env.books[id];},flush:()=>{if(env.failFlush)throw Error('flush failed');env.flushes++;}},
    LockService:{getScriptLock:()=>({tryLock:ms=>{env.lockAttempts.push(ms);if(env.locked)return false;env.locked=true;return true;},waitLock:ms=>{env.lockAttempts.push(ms);if(env.locked)throw Error('busy');env.locked=true;},releaseLock:()=>{env.locked=false;},hasLock:()=>env.locked})},
    PropertiesService:{getScriptProperties:()=>({getProperty:k=>env.props[k]||null})},
    ScriptApp:{getProjectTriggers:()=>env.triggers,newTrigger:name=>({timeBased(){return this;},everyMinutes(n){assert.equal(n,1);return this;},create(){env.triggers.push({getHandlerFunction:()=>name});return env.triggers.at(-1);}})},
    Utilities:{getUuid:()=>'uuid-'+(++env.uuid),DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(algorithm,s)=>Array.from(require('node:crypto').createHash(algorithm).update(s).digest()),formatDate:(d,tz,pattern)=>{assert.equal(tz,'Europe/Bratislava');return new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(d);}},
    cacheGetText_:k=>env.cache[k]||null,cachePutText_:(k,s,ttl)=>{env.cache[k]=s;env.cacheTtls[k]=ttl;},cacheBust_:k=>delete env.cache[k],jsonResponse:x=>plain(x),Logger:{log:()=>{}},
    pushTokenSheet_:ss=>ss.getSheetByName('Push_Tokens')||ss.insertSheet('Push_Tokens'),
    pushSendRows_:(ss,rows,line,title,body,link,event)=>{assert.equal(env.locked,false,'Push must run after releasing transaction lock');env.sends.push({rows:plain(rows),line,title,body,link,event});return {sent:env.failPush||(env.failTokens||[]).some(t=>rows.some(r=>r.token===t))?0:rows.length,total:rows.length};}
  };vm.createContext(ctx);vm.runInContext(realAuth+'\n'+realOwnProfile+'\n'+extension,ctx);return ctx;}
  const ctx=context(),ss=env.books['sheet-gp'];
  const request=(user='admin',line='gp',body,params={})=>({parameter:Object.assign({action:'getGarage',token:'test-api',username:user,device_id:'device',session_token:'session-'+user,garage_source_line:line},params),postData:body?{contents:JSON.stringify(body)}:undefined});
  const call=(user,action,body,line='gp',params={})=>ctx.garageHandleAction_(ss,request(user,line,body,Object.assign({action},params)),action);
  const mutate=(user,command,payload,commandId='command-'+(++env.uuid))=>call(user,'garageAction',{commandId,command,payload});
  return {env,ctx,ss,context,request,call,mutate};
}
test('actual source sessions authenticated and private bridges fail explicitly',()=>{
  const f=setup();assert.equal(f.call('admin','getGarage').me.canAdmin,true);assert.equal(f.call('manager','getGarage',null,'gyn').me.role,'management');
  assert.equal(f.call('admin','getGarage',null,'gp',{session_token:'forged'}).ok,false);assert.equal(f.call('admin','getGarage',null,'gp',{token:'wrong'}).ok,false);
  delete f.env.props.GARAGE_GYN_SHEET_ID;assert.equal(f.call('manager','getGarage',null,'gyn').code,'SOURCE_CONFIG');
  assert.equal(f.ctx._pouzMemo,null);
});
test('only management and GP office/fleet roles auto enrol',()=>{
  const f=setup();assert.equal(f.call('office.a','getGarage').me.role,'office');assert.equal(f.call('fleet','getGarage').me.role,'fleet');assert.equal(f.call('rep','getGarage').code,'NOT_MEMBER');
  assert.equal(f.call('office.b','getGarage',null,'gyn').code,'NOT_MEMBER');assert.equal(f.call('office.b','getGarage',null,'reagila').code,'NOT_MEMBER');
  assert.equal(f.call('manager','getGarage').me.weeklyDays,0);
});
test('office source sessions cannot read medical data through the central gateway',()=>{
  const f=setup();
  for(const action of ['getPharmaData','getPlnenieAll','getAllHistory','getNastenka','getCalEvents'])assert.equal(f.ctx.authRequireSession_(f.ss,f.request('office.a','gp',null,{action}),'gp').ok,false,action);
  assert.equal(f.call('office.a','getGarage').ok,true);
});
test('member binding accepts exact existing source logins and protects admin promotion',()=>{
  const f=setup();f.call('admin','getGarage');
  assert.equal(f.mutate('admin','memberSave',{id:'imaginary',role:'office',weeklyDays:3}).code,'INVALID_MEMBER');
  assert.equal(f.mutate('admin','memberSave',{id:'rep',role:'office',weeklyDays:3}).ok,true);assert.equal(f.call('rep','getGarage').me.weeklyDays,3);
  f.call('fleet','getGarage');assert.equal(f.mutate('fleet','memberSave',{id:'office.b',role:'admin',weeklyDays:3}).code,'FORBIDDEN');
});
test('getGarage lightweight cache rechecks active member and fresh bypasses cache',()=>{
  const f=setup();f.call('office.a','getGarage');const sh=f.ss.getSheetByName('Garage_State'),reads=sh.reads;f.call('office.a','getGarage');assert.equal(sh.reads,reads);
  f.call('office.a','getGarage',null,'gp',{fresh:'1'});assert.ok(sh.reads>reads);
  f.call('admin','getGarage');f.mutate('admin','memberSave',{id:'office.a',role:'office',weeklyDays:3,active:false});assert.equal(f.call('office.a','getGarage').code,'NOT_MEMBER');
});
test('writes flush once, return filtered snapshot, and idempotent retry creates no second audit',()=>{
  const f=setup();f.call('office.a','getGarage');const writes=f.env.stateWrites,flushes=f.env.flushes;
  const body={commandId:'stable-command',command:'reservationSave',payload:{date:'2026-10-13',spaceId:'b3-1',start:'08:00',end:'12:00'}};
  const one=f.call('office.a','garageAction',body);assert.equal(one.ok,true);assert.equal(f.env.stateWrites,writes+1);assert.equal(f.env.flushes,flushes+1);assert.equal(one.snapshot.dedup,undefined);assert.equal(one.snapshot.outbox,undefined);
  const retry=f.call('office.a','garageAction',body);assert.deepEqual(retry.result,one.result);assert.equal(retry.snapshot.version,one.snapshot.version);assert.equal(f.env.stateWrites,writes+1);
  body.payload.end='13:00';assert.equal(f.call('office.a','garageAction',body).code,'COMMAND_REUSED');body.commandId='x';assert.equal(f.call('office.a','garageAction',body).code,'INVALID_COMMAND_ID');
});
test('independent concurrent callers serialise collisions and reject a bounded busy contender',()=>{
  const f=setup();f.call('office.a','getGarage');f.call('office.b','getGarage');const other=f.context();let contender;
  f.env.duringWrite=()=>{contender=other.garageHandleAction_(f.ss,f.request('office.b','gp',{commandId:'concurrent-b',command:'reservationSave',payload:{date:'2026-10-13',spaceId:'b3-1'}}),'garageAction');};
  assert.equal(f.mutate('office.a','reservationSave',{date:'2026-10-13',spaceId:'b3-1'}).ok,true);assert.equal(contender.code,'BUSY');
  const result=other.garageHandleAction_(f.ss,f.request('office.b','gp',{commandId:'concurrent-b',command:'reservationSave',payload:{date:'2026-10-13',spaceId:'b3-1'}}),'garageAction');assert.equal(result.code,'CONFLICT');assert.ok(f.env.lockAttempts.every(ms=>ms<=5000));
});
test('validation and persistence failure do not report success or corrupt originals',()=>{
  const f=setup();f.call('office.a','getGarage');const initial=f.call('office.a','getGarage');
  assert.equal(f.mutate('office.a','attendanceSet',{dates:['2026-10-13','2026-12-01'],office:true}).ok,false);assert.equal(f.call('office.a','getGarage').version,initial.version);
  f.env.failWrite=true;assert.equal(f.mutate('office.a','reservationSave',{date:'2026-10-13',spaceId:'b3-1'}).ok,false);f.env.failWrite=false;assert.equal(f.call('office.a','getGarage',null,'gp',{fresh:'1'}).reservations.length,0);
  f.env.failFlush=true;assert.equal(f.mutate('office.a','reservationSave',{date:'2026-10-13',spaceId:'b3-1'},'flush-retry').ok,false);f.env.failFlush=false;
  const retry=f.mutate('office.a','reservationSave',{date:'2026-10-13',spaceId:'b3-1'},'flush-retry');assert.equal(retry.ok,true);assert.equal(retry.snapshot.reservations.length,1);
});
test('chunked state single rectangular write stays below Google cell limits',()=>{
  const f=setup(),s=f.ctx.SatoriGarageModel.createState();s.audit=Array.from({length:1000},(_,i)=>({id:'audit-'+i,actor:'test',name:'x'.repeat(80),command:'attendanceSet',time:'2026-10-12T07:00:00Z'}));
  const lock=f.ctx.LockService.getScriptLock();assert.equal(lock.tryLock(1),true);const before=f.env.stateWrites;f.ctx.garageWriteState_(f.ss,s);lock.releaseLock();
  const rows=f.ss.getSheetByName('Garage_State').rows;assert.ok(rows.length>2);assert.equal(f.env.stateWrites,before+1);assert.ok(rows.every(r=>r.every(v=>typeof v!=='string'||v.length<=30000)));
  assert.deepEqual(plain(f.ctx.garageReadState_(f.ss)),plain(s));
});
test('Garage push registration preserves existing medical subscription',()=>{
  const f=setup();f.call('office.a','getGarage');f.ss.sheets.Push_Tokens=new FakeSheet('Push_Tokens',f.env,[['login','line','token','updated_at'],['office.a','gp','shared-token','date']]);
  assert.equal(f.call('office.a','garageRegisterPush',{token:'shared-token'}).ok,true);
  const rows=f.ss.sheets.Push_Tokens.rows;assert.equal(rows.length,3);assert.equal(rows[1][1],'gp');assert.equal(rows[2][1],'garage');f.call('office.a','garageRegisterPush',{token:'shared-token'});assert.equal(rows.length,3);
});
test('release outbox targets all active Garage users, sends after lock and retains failed deliveries',()=>{
  const f=setup();f.call('office.a','getGarage');f.call('office.b','getGarage');f.ss.sheets.Push_Tokens=new FakeSheet('Push_Tokens',f.env,[['login','line','token','updated_at'],['office.a','garage','token-a','date'],['office.b','garage','token-b','date'],['rep','garage','token-rep','date'],['office.b','gp','token-medical','date']]);
  f.mutate('office.b','waitlistSet',{date:'2026-10-13',start:'08:00',end:'12:00',enabled:true});const r=f.mutate('office.a','reservationSave',{date:'2026-10-13',spaceId:'b3-1'}).result;
  f.env.failPush=true;const cancelled=f.mutate('office.a','reservationCancel',{ids:[r.id]},'cancel-stable');assert.equal(cancelled.ok,true);assert.equal(cancelled.snapshot.reservations.length,0);assert.equal(cancelled.pushPending,true);assert.equal(f.env.sends.length,0);const drain=f.call('office.a','garageDrainPush',{});assert.equal(drain.ok,true,JSON.stringify(drain));assert.ok(f.env.sends.length);assert.ok(f.env.sends.every(x=>x.line==='garage'&&x.body.includes('2026-10-13')&&x.body.includes('−3')&&x.link.includes('garage')));
  assert.ok(f.env.sends.flatMap(x=>x.rows).every(x=>x.token==='token-a'||x.token==='token-b'));
  f.env.failPush=false;f.env.now='2026-10-12T07:01:01Z';f.ctx.garageDrainOutbox_(f.ss);assert.ok(f.env.sends.length>2);const delivered=f.env.sends.length;f.ctx.garageDrainOutbox_(f.ss);assert.equal(f.env.sends.length,delivered);
  f.mutate('office.a','reservationCancel',{ids:[r.id]},'cancel-stable');assert.equal(f.env.sends.length,delivered);
});
test('replayed member binding returns committed result even after source account removal',()=>{
  const f=setup();f.call('admin','getGarage');const p={id:'rep',role:'office',weeklyDays:3};const one=f.mutate('admin','memberSave',p,'bind-retry');assert.equal(one.ok,true);
  f.ss.sheets.Pouzivatelia.rows=f.ss.sheets.Pouzivatelia.rows.filter(x=>x[0]!=='rep');const retry=f.mutate('admin','memberSave',p,'bind-retry');assert.equal(retry.ok,true);assert.deepEqual(retry.result,one.result);
});
test('stable Garage deep link and optional retry trigger install only once',()=>{
  const f=setup(), content=f.ctx.garagePushContent_({id:'cmd:0',notice:{type:'release',date:'2026-10-13',number:'1',floor:-3,start:'08:00',end:'12:00'}});
  assert.ok(content.link.includes('garage=1'));assert.ok(content.link.includes('pushline=garage'));assert.ok(content.link.includes('date=2026-10-13'));
  assert.equal(typeof f.ctx.garageInstallTrigger,'function');f.ctx.garageInstallTrigger();f.ctx.garageInstallTrigger();assert.equal(f.env.triggers.length,1);
});
test('all approved management and GP office aliases enrol without admitting representatives',()=>{
  const f=setup();
  for(const rawRole of ['boss','bum','pm','am','am west','am east','amwest','ameast','asistent','manager','management','gyn manager','gyn-am','gyn-pm','gyn-bum','gyn-asistent','gyn am west','gyn am east','gyn amwest','gyn ameast','am gyn'])assert.equal(f.ctx.garageAutoRole_({sourceLine:'gyn',rawRole}),'management');
  for(const rawRole of ['office','office user','garaz','garáž'])assert.equal(f.ctx.garageAutoRole_({sourceLine:'gp',rawRole}),'office');
  for(const rawRole of ['fleet','fleet manager','parking manager'])assert.equal(f.ctx.garageAutoRole_({sourceLine:'gp',rawRole}),'fleet');
  for(const rawRole of ['gyn-rep','rep west','unknown','office','fleet'])assert.equal(f.ctx.garageAutoRole_({sourceLine:'gyn',rawRole}),'');
  f.call('admin','getGarage');const save=f.call('admin','garageAction',{commandId:'bind-gyn-user',command:'memberSave',payload:{id:'manager',role:'management',weeklyDays:0,sourceLine:'gyn'}});assert.equal(save.snapshot.members.find(x=>x.id==='manager').sourceLine,'gyn');
});
test('server calendar follows Bratislava midnight and daylight saving rollover',()=>{
  const f=setup();
  for(const [instant,date] of [['2026-10-24T22:30:00Z','2026-10-25'],['2026-10-25T22:30:00Z','2026-10-25'],['2026-10-25T23:30:00Z','2026-10-26']]){
    f.ctx.Date=class extends Date{constructor(...args){super(...(args.length?args:[instant]));}};assert.equal(f.ctx.garageClock_().today,date);
  }
});
test('malformed persisted data is rejected instead of silently replaced',()=>{
  const f=setup();f.ss.sheets.Garage_State=new FakeSheet('Garage_State',f.env,[['broken',1,2],[2,0,'{}']]);
  const before=f.env.stateWrites;assert.equal(f.call('admin','getGarage',null,'gp',{fresh:'1'}).code,'STATE_INVALID');assert.equal(f.env.stateWrites,before);
});
test('failed first push item backs off and cannot starve a later working recipient',()=>{
  const f=setup();f.call('office.a','getGarage');f.call('office.b','getGarage');f.ss.sheets.Push_Tokens=new FakeSheet('Push_Tokens',f.env,[['login','line','token','updated_at'],['office.a','garage','bad-token','date'],['office.b','garage','good-token','date']]);
  const lock=f.ctx.LockService.getScriptLock();assert.equal(lock.tryLock(1),true);const state=f.ctx.garageReadState_(f.ss),clock=f.ctx.garageClock_();
  f.ctx.garageEnqueue_(state,'first-command',[{type:'offer',audience:['office.a'],date:'2026-10-13',number:'1',floor:-3,start:'08:00',end:'12:00'}],clock);
  f.ctx.garageEnqueue_(state,'second-command',[{type:'offer',audience:['office.b'],date:'2026-10-13',number:'2',floor:-3,start:'08:00',end:'12:00'}],clock);f.ctx.garageWriteState_(f.ss,state);lock.releaseLock();
  f.env.failTokens=['bad-token'];f.ctx.garageDrainOutbox_(f.ss);
  const stored=f.ctx.garageReadState_(f.ss),first=stored.outbox.find(x=>x.id==='first-command:0'),second=stored.outbox.find(x=>x.id==='second-command:0');
  assert.equal(first.status,'pending');assert.equal(first.attempts,1);assert.ok(Date.parse(first.nextAttemptAt)>Date.parse(clock.now));assert.equal(second.status,'done');assert.ok(f.env.sends.some(x=>x.rows.some(r=>r.token==='good-token')));
  const sent=f.env.sends.length;f.ctx.garageDrainOutbox_(f.ss);assert.equal(f.env.sends.length,sent);f.env.now='2026-10-12T07:01:01Z';f.ctx.garageDrainOutbox_(f.ss);assert.equal(f.ctx.garageReadState_(f.ss).outbox[0].attempts,2);
});
test('switching Garage login revokes the same device token from previous owners only',()=>{
  const f=setup();f.call('office.a','getGarage');f.ss.sheets.Push_Tokens=new FakeSheet('Push_Tokens',f.env,[['login','line','token','updated_at'],['office.b','gp','device-token','date'],['office.b','garage','device-token','date'],['office.a','reagila','device-token','date'],['office.b','garage','other-token','date']]);
  assert.equal(f.call('office.a','garageRegisterPush',{token:'device-token'}).ok,true);const rows=f.ss.sheets.Push_Tokens.rows;
  assert.ok(!rows.some(x=>x[0]==='office.b'&&x[2]==='device-token'));assert.ok(rows.some(x=>x[0]==='office.a'&&x[1]==='reagila'&&x[2]==='device-token'));assert.ok(rows.some(x=>x[0]==='office.b'&&x[2]==='other-token'));
  assert.equal(rows.filter(x=>x[0]==='office.a'&&x[1]==='garage'&&x[2]==='device-token').length,1);
});
test('only a source-authenticated active member can request pending Garage delivery',()=>{
  const f=setup();f.call('office.a','getGarage');f.ss.sheets.Push_Tokens=new FakeSheet('Push_Tokens',f.env,[['login','line','token','updated_at'],['office.a','garage','member-token','date']]);
  const r=f.mutate('office.a','reservationSave',{date:'2026-10-13',spaceId:'b3-1'}).result;const released=f.mutate('office.a','reservationCancel',{ids:[r.id]});assert.equal(released.ok,true);assert.equal(released.pushPending,true);assert.equal(f.env.sends.length,0);
  assert.equal(f.call('rep','garageDrainPush',{}).code,'NOT_MEMBER');assert.equal(f.call('office.b','garageDrainPush',{}).code,'NOT_MEMBER');assert.equal(f.call('unknown','garageDrainPush',{}).code,'SESSION_EXPIRED');assert.equal(f.call('office.a','garageDrainPush',{},'gp',{session_token:'forged'}).code,'SESSION_EXPIRED');assert.equal(f.env.sends.length,0);
  assert.equal(f.call('office.a','garageDrainPush',{}).ok,true);assert.equal(f.env.sends.length,1);assert.equal(f.env.sends[0].line,'garage');
});
test('office accounts may write their own avatar and preferences but no medical reads',()=>{
  const f=setup();f.ss.sheets.Pouzivatelia.rows[0].push('avatar','nastavenia');for(const action of ['setAvatar','setUserPref']){
    assert.equal(f.ctx.authRequireSession_(f.ss,f.request('office.a','gp',null,{action}),'gp').ok,true,action);
    assert.equal(f.ctx.authRequireSession_(f.ss,f.request('office.b','gp',null,{action,session_token:'session-office.a'}),'gp').ok,false,'Other username cannot reuse this session');
    assert.equal(f.ctx.authRequireSession_(f.ss,f.request('office.a','gp',null,{action,session_token:'forged'}),'gp').ok,false);
    const config=JSON.stringify({style:'adventurer',seed:'test'}),prefs=JSON.stringify({notifGarage:true});
    assert.equal(f.ctx.ownProfileEndpoint_(f.ss,f.request('office.a','gp',null,{action,config,prefs})).ok,true,'Real '+action+' write allowed');
    const before=plain(f.ss.sheets.Pouzivatelia.rows);assert.equal(f.ctx.ownProfileEndpoint_(f.ss,f.request('office.b','gp',null,{action,config,prefs,session_token:'session-office.a'})).ok,false);assert.deepEqual(f.ss.sheets.Pouzivatelia.rows,before,'Another account unchanged');
    const own=f.ss.sheets.Pouzivatelia.rows.find(r=>r[0]==='office.a');assert.equal(own[action==='setAvatar'?4:5],action==='setAvatar'?config:prefs);
  }
  for(const action of ['getInitData','getRepList','getAllHistory','getPharmaData','getPlnenie','getPlnenieAll','getLastLogins','getReps','getNastenka','getCalEvents','getUserPref'])assert.equal(f.ctx.authRequireSession_(f.ss,f.request('office.a','gp',null,{action}),'gp').ok,false,action);
  assert.ok(primary.includes('avUser !== auth.username && !authIsGpAdmin_(auth.user)'));assert.ok(primary.includes('pUser !== pAuth.username && !authIsGpAdmin_(pAuth.user)'));
});

test('cached legacy layout is migrated under lock on first read and persisted only once',()=>{
  const f=setup();f.call('office.a','getGarage');const state=f.ctx.garageReadState_(f.ss);delete state.config.layoutVersion;state.config.slots.forEach((s,i)=>s.number=String(i+1));
  state.reservations.push({id:'stable-booking',revision:8,owner:'office.a',name:'Office A',date:'2026-10-13',start:'08:00',end:'12:00',spaceId:'b3-1'});
  state.offers.push({id:'stable-offer',owner:'office.a',date:'2026-10-13',start:'08:00',end:'12:00',spaceId:'b3-1',status:'open'});
  state.attendance.push({owner:'office.a',date:'2026-10-13',office:true});state.waitlist.push({id:'stable-wait',owner:'office.a',date:'2026-10-13',start:'08:00',end:'12:00'});
  state.blocks.push({id:'stable-block',date:'2026-10-14',start:'08:00',end:'12:00',spaceId:'b3-2'});
  state.dedup.push({id:'stable-retry',actor:'office.a',result:{id:'stable-booking'}});state.outbox.push({id:'stable-push',status:'pending',notice:{floor:-1,spaceId:'b1-7',number:'7'}});
  const records=plain(Object.fromEntries(['members','reservations','offers','attendance','waitlist','blocks','dedup'].map(k=>[k,state[k]]))),ids=state.config.slots.map(s=>s.id);
  const lock=f.ctx.garageTakeLock_();f.ctx.garageWriteState_(f.ss,state);lock.releaseLock();const writes=f.env.stateWrites,reads=f.ss.sheets.Garage_State.reads;
  const one=f.call('office.a','getGarage');assert.equal(one.ok,true);assert.deepEqual(one.config.slots.map(s=>s.number),['587','588','590','589','612','613','','']);assert.deepEqual(one.config.slots.map(s=>s.id),plain(ids));
  assert.ok(f.ss.sheets.Garage_State.reads>reads,'Legacy cached state bypasses cache');assert.equal(f.env.stateWrites,writes+1);const stored=f.ctx.garageReadState_(f.ss);
  for(const k of Object.keys(records))assert.deepEqual(plain(stored[k]),records[k],k+' preserved');assert.equal(stored.outbox[0].notice.number,'');assert.equal(stored.outbox[0].id,'stable-push');
  f.call('office.a','getGarage');f.call('office.a','getGarage',null,'gp',{fresh:'1'});assert.equal(f.env.stateWrites,writes+1);
});

test('migration change is retained when an existing member needs no enrolment',()=>{
  const f=setup();f.call('office.a','getGarage');const state=f.ctx.garageReadState_(f.ss);delete state.config.layoutVersion;state.config.slots.forEach((s,i)=>s.number=String(i+1));const lock=f.ctx.garageTakeLock_();f.ctx.garageWriteState_(f.ss,state);lock.releaseLock();
  const writes=f.env.stateWrites;assert.equal(f.call('office.a','garageRegisterPush',{token:'token-existing-member'}).ok,true);assert.equal(f.env.stateWrites,writes+1);assert.equal(f.ctx.garageReadState_(f.ss).config.layoutVersion,2);
});

test('unnumbered floor push content never invents a numbered space',()=>{
  for(const number of ['7','8','',undefined]){const f=setup(),body=f.ctx.garagePushContent_({id:'pool',notice:{type:'release',date:'2026-10-13',floor:-1,number,start:'08:00',end:'12:00'}}).body;assert.ok(body.includes('podlažie −1'));assert.ok(!body.includes('miesto '+number));assert.ok(!/miesto (?:7|8|undefined)/.test(body));}
});

test('celebrations disclose only today or tomorrow active member names from their own source',()=>{
  const f=setup();f.call('admin','getGarage');const state=f.ctx.garageReadState_(f.ss);
  state.members.push({id:'office.a',name:'Office A',sourceLine:'gp',role:'office',active:true},{id:'manager',name:'Gyn Manager',sourceLine:'gyn',role:'management',active:true},{id:'rep',name:'Inactive',sourceLine:'reagila',role:'office',active:false});
  const header=[' Narodeniny ','username','name'];f.ss.sheets.Pouzivatelia.rows=[header,['12.10.1980','office.a','Office A'],['12.10.1970','manager','Wrong source'],['12.10.1960','not-a-member','Non member'],['14.10.1990','admin','Admin']];
  f.env.books['sheet-gyn'].sheets.Pouzivatelia.rows=[['login','narodeniny'],['manager','1992-10-13'],['rep','1988-10-12']];
  const context=f.ctx.garageClock_(),list=plain(f.ctx.garageCelebrations_(f.ss,state,context));assert.deepEqual(list,[{id:'office.a',name:'Office A',when:0},{id:'manager',name:'Gyn Manager',when:1}]);
  assert.ok(list.every(x=>Object.keys(x).sort().join(',')==='id,name,when'));assert.ok(!JSON.stringify(list).includes('1980'));assert.ok(!JSON.stringify(list).includes('1992'));
  const sourceReads=Object.values(f.env.books).map(book=>book.sheets.Pouzivatelia.reads);f.ctx.garageCelebrations_(f.ss,state,context);assert.deepEqual(Object.values(f.env.books).map(book=>book.sheets.Pouzivatelia.reads),sourceReads);
  const celebrationKeys=Object.keys(f.env.cacheTtls).filter(k=>k.startsWith('garage:celebrations:'));assert.ok(celebrationKeys.length);assert.ok(celebrationKeys.every(k=>f.env.cacheTtls[k]===300));
  state.members.find(m=>m.id==='office.a').active=false;assert.deepEqual(plain(f.ctx.garageCelebrations_(f.ss,state,context)),[{id:'manager',name:'Gyn Manager',when:1}]);
  context.today='2026-10-13';assert.deepEqual(plain(f.ctx.garageCelebrations_(f.ss,state,context)),[{id:'manager',name:'Gyn Manager',when:0},{id:'admin',name:'Admin',when:1}]);
});

test('birthday parser accepts actual dates, D.M and ISO while optional source failure leaves Garage usable',()=>{
  const f=setup();assert.equal(f.ctx.garageBirthdayMonthDay_(new f.ctx.Date('1981-10-11T23:30:00Z')),'10-12');
  for(const raw of ['12.10','12. 10.','12.10.1981','1981-10-12','1981-10-12T00:00:00Z'])assert.equal(f.ctx.garageBirthdayMonthDay_(raw),'10-12',raw);
  for(const raw of ['31.2.1981','wrong','2026-13-12','12/10/1981',''])assert.equal(f.ctx.garageBirthdayMonthDay_(raw),'',raw);
  const snapshot=f.call('office.a','getGarage');assert.deepEqual(snapshot.celebrations,[]);const state=f.ctx.garageReadState_(f.ss);state.members.push({id:'manager',name:'Gyn Manager',sourceLine:'gyn',role:'management',active:true});
  const lock=f.ctx.garageTakeLock_();f.ctx.garageWriteState_(f.ss,state);lock.releaseLock();delete f.env.books['sheet-gyn'];assert.equal(f.call('office.a','getGarage').ok,true);assert.deepEqual(f.call('office.a','getGarage').celebrations,[]);
});
console.log(`${passed} Garage backend tests passed`);
if(failed)process.exitCode=1;
