'use strict';
// Real private auth helpers, synthetic in-memory users only. No live requests.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const backend=process.env.SATORI_APPS_SCRIPT_DIR||path.resolve(__dirname,'../../../apps_script');
function sheet(rows=[]){return {rows,getLastRow(){return this.rows.length;},getLastColumn(){return Math.max(0,...this.rows.map(r=>r.length));},getDataRange(){return this.getRange(1,1,this.rows.length,this.getLastColumn());},getRange(r,c,n=1,m=1){const s=this;return {getValues:()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>s.rows[r-1+i]?.[c-1+j]??'')),setValues:vals=>vals.forEach((row,i)=>row.forEach((v,j)=>{(s.rows[r-1+i]??=[])[c-1+j]=v;})),setValue:v=>{(s.rows[r-1]??=[])[c-1]=v;}};},appendRow(r){this.rows.push(r.slice());},deleteRow(r){this.rows.splice(r-1,1);}};}
function setup(kind){
 const text=fs.readFileSync(path.join(backend,'KOD_'+kind+'.txt'),'utf8');
 function extract(name,next){const a=text.indexOf('function '+name+'('),b=text.indexOf('function '+next+'(',a);assert.ok(a>=0&&b>a,name);return text.slice(a,b);}
 const users=sheet([['login','heslo','meno','rola'],['alice','synthetic-original','Alice','admin'],['bob','different-password','Bob','admin']]),sessions=sheet();
 const book={getSheetByName:n=>n==='Pouzivatelia'?users:n==='Sessions'?sessions:null,insertSheet:()=>sessions};let uid=0;
 const ctx={Date,JSON,Math,Number,String,Object,Array,Error,AUTH_SESSION_HOURS:12,AUTH_SESSION_REMEMBER_DAYS:30,AUTH_SESSION_STALE_DAYS:2,
  requireToken:()=>true,pouzValues_:ss=>ss.getSheetByName('Pouzivatelia').getDataRange().getValues(),
  authGetUser_:()=>({role:'admin'}),authGetGynUser_:()=>({role:'admin'}),reagilaTeamSplitTargets_:()=>[],reagilaStagedManager_:()=>false,reagilaTeamSplitEnabled_:()=>false,
  PropertiesService:{getScriptProperties:()=>({getProperty:()=>null})},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},
  Utilities:{getUuid:()=>String(++uid),DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(alg,s)=>Array.from(crypto.createHash(alg).update(s).digest())},
  jsonResponse:x=>x,jsonResp:x=>x};
 vm.createContext(ctx);vm.runInContext(extract('authGetSessionsSheet_','authLogoutSession_')+'\n'+extract('authHandleChangePassword_','doPost'),ctx);
 const line=kind==='GYN'?'gyn':'gp',login=(user='alice',remember=true)=>ctx.authCreateSession_(book,user,line,'device-'+(++uid),'',remember);
 const request=(s,user='alice')=>({parameter:{username:user,device_id:s.device_id,session_token:s.token,action:'getStockData'}});
 const auth=(s,user='alice')=>ctx.authRequireSession_(book,request(s,user),line);
 return {ctx,book,users,sessions,line,login,auth,request};
}
for(const kind of ['GOLEM','GYN','REAGILA']){
 const f=setup(kind),a=f.login(),b=f.login('alice',false),other=f.login('bob');
 assert.equal(f.auth(a).ok,true);assert.equal(f.auth(b).ok,true);
 f.users.rows[1][1]='synthetic-new-password';
 assert.equal(f.auth(a).ok,false,kind+': a direct Sheet password edit must invalidate remembered sessions');
 assert.equal(f.auth(b).ok,false,kind+': all devices must be invalidated');assert.equal(f.auth(other,'bob').ok,true,'Other users stay signed in');
 f.users.rows[1][1]='synthetic-original';assert.equal(f.auth(a).ok,false,'Observed password mismatch permanently revokes the token');f.users.rows[1][1]='synthetic-new-password';
 const fresh=f.login();assert.equal(f.auth(fresh).ok,true,'Fresh login works');
 const stampColumn=f.sessions.rows[0].indexOf('credential_stamp');assert.ok(stampColumn>=9,'Server-only stamp preserves existing columns');
 assert.equal(JSON.stringify(fresh).includes('credential'),false,'Never expose verifier in a login response');
 assert.notEqual(f.sessions.rows[1][stampColumn],f.users.rows[1][1]);
 const freshRow=f.sessions.rows.find(r=>r[2]===fresh.token);freshRow[stampColumn]='';assert.equal(f.auth(fresh).ok,false,'Legacy sessions fail closed');
 const appSession=f.login(),secondDevice=f.login();const req=f.request(appSession);req.postData={contents:JSON.stringify({old_password:'synthetic-new-password',new_password:'synthetic-third-password'})};
 // Use the exact app payload names.
 const source=fs.readFileSync(path.join(backend,'KOD_'+kind+'.txt'),'utf8');
 assert.match(source,/old_password|oldPassword|old_password/);
 req.postData.contents=JSON.stringify({old_password:'synthetic-new-password',new_password:'synthetic-third-password',oldPassword:'synthetic-new-password',newPassword:'synthetic-third-password'});
 assert.equal(f.ctx.authHandleChangePassword_(f.book,req,f.line).ok,true,'App password change succeeds');
 assert.equal(f.auth(secondDevice).ok,false);
 f.users.rows[1][1]='synthetic-new-password';assert.equal(f.auth(secondDevice).ok,false,'App-revoked sessions never revive if a password is reused');
 const blank=f.login();f.users.rows[1][1]='';assert.equal(f.auth(blank).ok,false,'Blank/removed credentials cannot keep a session');
 console.log(kind+': password edit, devices, user isolation, legacy, app revocation passed');
}
module.exports={setup,sheet};
