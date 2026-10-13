const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const chooser=app.slice(app.indexOf('function lineChooserEsc('),app.indexOf('// ── Zapamätanie prihlásenia'));
let session=null,dual=null,open=false,resumed=0,medical=0,requests=[],response;
const elements={'login-screen':{classList:{remove(){}}},'line-chooser-screen':{innerHTML:'',classList:{add(){},remove(){},contains(){return true;}}},'line-remember-cb':{checked:false}};
const store=new Map();
const c={console,Date,URL,URLSearchParams,AbortController,setTimeout,clearTimeout,Promise,Error,Set,
 location:{href:'https://satori.test/index.html'},navigator:{onLine:true},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},
 document:{body:{classList:{add(){},remove(){}}},getElementById:id=>elements[id]||null},
 getSession:()=>session,setSession:s=>{session=s;},mgrGetDual:()=>dual,initLogin:()=>resumed++,bootLoaderDone(){},loginScreenSetExclusive(){},
 mgrBuildGpUser:(username,d)=>({...d,username,line:'gp'}),mgrBuildGynUser:(username,d)=>({...d,username,line:'gyn'}),mgrBuildReagilaUser:(username,d)=>({...d,username,line:'reagila'}),
 loginSuccess:()=>medical++,gynLoginSuccess:()=>medical++,authDeviceId:()=> 'fixture-device',SCRIPT_URL:'https://script.google.com/macros/s/fixture/exec',API_TOKEN:'fixture-api',
 fetch:async(url)=>{requests.push(new URL(url));return {ok:true,json:async()=>response};},
 SatoriGarage:{configure(){},open(){open=true;},close(){open=false;},isOpen:()=>open,reset(){}},mgrSetDual:d=>{dual=d;},IS_DEV:true};
c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(root,'garage-integration.js'),'utf8'),c);vm.runInContext(chooser,c);
const bridge=c.SatoriGarageBridge;
const data=(role='admin')=>({ok:true,name:'Test User',role,session_token:'fixture-'+role,device_id:'fixture-device'});
(async()=>{
 assert.equal(typeof c.lineGarageLoginSource,'function','chooser must derive an authorised Garage source');
 const map={gp:data(),gyn:data('gyn manager'),reagila:data('bum')}; response={ok:true,me:{id:'test'}};for(const line of Object.keys(map))await bridge.checkLoginAccess('test',line,map[line]);
 assert.equal(c.lineGarageLoginSource('test',map),'gp');
 c.showLineChooser('test',['gp','gyn','reagila'],map,[],[]);
 assert.match(elements['line-chooser-screen'].innerHTML,/id="line-choose-garage"/);
 assert.match(elements['line-chooser-screen'].innerHTML,/Parkovanie a kancelária/);
 c.pickLine('garage');assert.equal(session.line,'gp');assert.equal(session.garage_start,true);assert.equal(open,true);assert.equal(medical,0,'Garage choice must not bootstrap medical screens');
 assert.equal(bridge.resumeMedical('gp'),true);assert.equal(resumed,1);assert.equal(open,false);assert.equal(session.garage_start,undefined);
 assert.equal(bridge.resumeMedical('gp'),false,'normal visits must not restart medical boot');
 const repMap={gp:data('rep west')};
 c.showLineChooser('rep',['gp'],repMap,[],[]);assert.doesNotMatch(elements['line-chooser-screen'].innerHTML,/line-choose-garage/);
 assert.equal(c.enterGarageFromLogin('rep',repMap),false);assert.equal(open,false);
 const gynMap={gp:data('rep west'),gyn:data('gyn manager')};await bridge.checkLoginAccess('test','gyn',gynMap.gyn);
 assert.equal(c.lineGarageLoginSource('test',gynMap),'gyn');
 dual={username:'test',gp:{...gynMap.gp,username:'test',line:'gp'},gyn:{...gynMap.gyn,username:'test',line:'gyn'}};
 c.enterGarageFromLogin('test',gynMap);assert.equal(session.line,'gyn');
 response={ok:true,me:{id:'test'}};await bridge.transport('getGarage');assert.equal(requests.pop().searchParams.get('garage_source_line'),'gyn','a lower-role Golem account must not override the authorised Gyn source');
 assert.equal(bridge.resumeMedical('gp'),true);assert.equal(session.line,'gp');assert.equal(resumed,2);
 assert.ok(bridge.canAccess(),'membership in another owned source remains available');
 assert.ok(bridge.targets().some(t=>t.line==='garage'),'the Garage target must remain present when current medical role differs');
 response={ok:true,me:{id:'rep'}};assert.equal(await bridge.checkLoginAccess('rep','gp',repMap.gp),true,'explicit member is recognised by the server');
 response={ok:false,code:'NOT_MEMBER',error:'No member'};assert.equal(await bridge.checkLoginAccess('rep','gp',repMap.gp),false);
 response={ok:true,me:{id:'somebody-else'}};await assert.rejects(bridge.checkLoginAccess('rep','gp',repMap.gp),/používateľa/i);
 session={username:'test',role:'admin',line:'gyn',session_token:'gyn-token',garage_start:true};response={ok:true,me:{id:'test'}};await bridge.checkLoginAccess('test','gyn',Object.assign(session,{ok:true}));assert.equal(bridge.bootstrap(session),true);assert.equal(open,true);assert.equal(medical,0);
 console.log('Garage chooser: eligibility, direct/restored entry, deferred medical boot, source credentials and member checks passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
