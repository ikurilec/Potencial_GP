'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
(async()=>{for(const prefix of ['', 'nahlad/']){
 let active={username:'alice',role:'admin',line:'reagila',session_token:'rea-token',device_id:'device',ok:true},dual={username:'alice',gp:{username:'alice',role:'admin',session_token:'gp-token',device_id:'device',ok:true},reagila:active},cfg,failGP=false,calls=[],clears=0;
 const w={URL,Date,Error,Map,Set,Promise,AbortController,setTimeout,clearTimeout,location:{href:'https://app.test/'},navigator:{onLine:true},localStorage:{setItem(){},getItem(){return null;}},document:{body:{classList:{add(){},remove(){}}},addEventListener(){},getElementById(){return null;}},
  getSession:()=>active,mgrGetDual:()=>dual,mgrSetDual:x=>dual=x,setSession:x=>active=x,authDeviceId:()=> 'device',SCRIPT_URL:'https://server.test/gp',GYN_SCRIPT_URL:'https://server.test/gyn',REAGILA_SCRIPT_URL:'https://server.test/reagila',API_TOKEN:'synthetic',
  clearSession:()=>{clears++;active=null;w.SatoriGarageBridge.reset();},showSessionExpiredModal(){},bootLoaderDone(){},
  fetch:async url=>{const u=new URL(url);calls.push(u.searchParams.get('garage_source_line'));return {ok:true,json:async()=>failGP&&u.searchParams.get('session_token')==='gp-token'?{ok:false,code:'SESSION_EXPIRED'}:{ok:true,me:{id:'alice'}}};},
  SatoriGarage:{configure:x=>cfg=x,reset(){},isOpen:()=>false}};
 w.window=w;vm.createContext(w);const app=fs.readFileSync(prefix+'app.js','utf8');vm.runInContext(app.slice(app.indexOf('function appHandleSessionRejection('),app.indexOf('function appFetchJsonRaw(')),w);vm.runInContext(fs.readFileSync(prefix+'garage-integration.js','utf8'),w);
 const bridge=w.SatoriGarageBridge;await bridge.checkLoginAccess('alice','gp',dual.gp);await bridge.checkLoginAccess('alice','reagila',active);
 calls=[];failGP=true;assert.equal((await bridge.transport('getGarage')).ok,true);assert.deepEqual(calls,['gp','reagila'],'A rejected source falls back exactly once');assert.equal(dual.gp,undefined);assert.equal(active.line,'reagila');assert.equal(clears,0,'Valid current medical login is preserved');
 // Restore a separate source credential; failed writes must never be replayed.
 dual.gp={username:'alice',role:'admin',session_token:'gp-token',device_id:'device',ok:true};failGP=false;await bridge.checkLoginAccess('alice','gp',dual.gp);calls=[];failGP=true;
 await assert.rejects(bridge.transport('garageAction',{command:'reservationCancel'}),/Prihlásenie/);assert.deepEqual(calls,['gp']);assert.equal(dual.gp,undefined);assert.equal(clears,0);
 console.log(prefix+'Garage: expired dual credential removed, read fallback, no write replay, current login retained');
}})().catch(e=>{console.error(e);process.exitCode=1;});
