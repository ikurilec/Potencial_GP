'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
for(const prefix of ['', 'nahlad/']){
 const src=fs.readFileSync(prefix+'app.js','utf8'),a=src.indexOf('function appHandleSessionRejection('),b=src.indexOf('function appFetchJsonRaw(',a);
 assert.ok(a>=0&&b>a,'Central session rejection helper exists');
 let s={username:'alice',line:'gp',session_token:'current',device_id:'device'},cleared=0,shown=0,done=0;
 const ctx={URL,SCRIPT_URL:'https://example.test/gp',GYN_SCRIPT_URL:'https://example.test/gyn',REAGILA_SCRIPT_URL:'https://example.test/reagila',getSession:()=>s,clearSession:()=>{cleared++;s=null;},showSessionExpiredModal:()=>shown++,bootLoaderDone:()=>done++};
 vm.createContext(ctx);vm.runInContext(src.slice(a,b),ctx);
 const url=(base='gp',token='current',user='alice')=>'https://example.test/'+base+'?username='+user+'&device_id=device&session_token='+token;
 for(const data of [{ok:true},{ok:false,error:'Forbidden'},{ok:false,error:'timeout'},{ok:false,error:'Unauthorized'}])assert.equal(ctx.appHandleSessionRejection(url(),data),false);
 for(const u of [url('gyn'),url('gp','old'),url('gp','current','bob'),url().replace('device_id=device','device_id=other'),url().replace('example.test','untrusted.test')])assert.equal(ctx.appHandleSessionRejection(u,{ok:false,error:'Session expired'}),false,'Late/unrelated responses cannot log out this session');
 assert.equal(cleared,0);assert.equal(ctx.appHandleSessionRejection(url(),{ok:false,error:'Session expired'}),true);assert.equal(cleared,1);assert.equal(shown,1);assert.equal(done,1);
 assert.equal(ctx.appHandleSessionRejection(url(),{ok:false,error:'Session expired'}),false);assert.equal(cleared,1,'Duplicate responses cannot repeat logout');
 s={username:'alice',line:'gyn',session_token:'current',device_id:'device'};
 assert.equal(ctx.appHandleSessionRejection(url('gp')+'&garage_source_line=gyn',{ok:false,code:'SESSION_EXPIRED'}),true,'Garage validates source-line session');
 assert.match(src,/appHandleSessionRejection\(url,\s*j\)/,'Real JSON transport invokes the helper');
 const garage=fs.readFileSync(prefix+'garage-integration.js','utf8');assert.match(garage,/appHandleSessionRejection\(u.href,\s*data\)/,'Garage transport invokes it too');
 console.log(prefix+'current-session expiry, stale requests, source line, errors and idempotence passed');
}
