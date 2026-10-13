/* Garáž is a virtual Satori interface; the authenticated medical session stays intact. */
(function (w) {
  'use strict';
  var configured=false, generation=0, controllers=new Set(), pushPromise=null, seenPush={}, pendingLink='', saving=0;
  function me(){return typeof w.getSession==='function'?w.getSession():null;}
  function id(s){return String(s&&s.username||'').trim().toLowerCase();}
  function role(s){return String(s&&s.role||'').trim().toLowerCase().replace(/[_-]+/g,' ').replace(/\s+/g,' ');}
  function officeOnly(s){s=s||me();return /^(office|office user|fleet|fleet manager|parking manager|garaz|garáž)$/.test(role(s));}
  function canAccessSession(s){return !!(s&&alive(s,id(s))&&(officeOnly(s)||s.garage_access===true||/^(admin|boss|bum|pm|am|am west|am east|amwest|ameast|asistent|manager|management|gyn manager|gyn am|gyn pm|gyn bum|gyn asistent|gyn am west|gyn am east|gyn amwest|gyn ameast|am gyn)$/.test(role(s))));}
  function canAccess(s){if(s)return canAccessSession(s);s=me();if(canAccessSession(s))return true;var dual=typeof w.mgrGetDual==='function'?w.mgrGetDual():null;return !!(s&&dual&&id(dual)===id(s)&&['gp','gyn','reagila'].some(function(line){return dual[line]&&id(dual[line])===id(s)&&canAccessSession(dual[line]);}));}
  function alive(s,owner){var expiry=Number(s&&s.session_expires_at)||Date.parse(s&&s.session_expires_at||'');return !!(s&&id(s)===owner&&s.session_token&&(!expiry||expiry>Date.now()));}
  function source(){
    var s=me(),owner=id(s);if(!s||!alive(s,owner))throw new Error('Prihlásenie vypršalo. Prihlás sa znova.');
    var dual=typeof w.mgrGetDual==='function'?w.mgrGetDual():null;
    if(dual&&id(dual)===owner&&alive(dual.gp,owner)&&canAccessSession(dual.gp))return {session:dual.gp,line:'gp',owner:owner};
    var line=s.line||'gp';if(['gp','gyn','reagila'].indexOf(line)<0)throw new Error('Neplatné prihlásenie do Satori.');
    if(!canAccessSession(s)&&dual&&id(dual)===owner){var allowed=['gyn','reagila'].find(function(key){return alive(dual[key],owner)&&canAccessSession(dual[key]);});if(allowed)return {session:dual[allowed],line:allowed,owner:owner};}
    return {session:s,line:line,owner:owner};
  }
  async function checkLoginAccess(username,line,data){
    var owner=String(username||'').trim().toLowerCase(),s=Object.assign({},data,{username:owner});
    if(!owner||!data||!data.ok||!alive(s,owner)||['gp','gyn','reagila'].indexOf(line)<0)return false;
    var epoch=generation,ctrl=new AbortController(),u=new URL(w.SCRIPT_URL,w.location.href);
    u.searchParams.set('action','getGarage');u.searchParams.set('token',w.API_TOKEN);u.searchParams.set('username',owner);
    u.searchParams.set('device_id',data.device_id||w.authDeviceId());u.searchParams.set('session_token',data.session_token);u.searchParams.set('garage_source_line',line);u.searchParams.set('_garage',String(Date.now()));
    controllers.add(ctrl);var timer=setTimeout(function(){ctrl.abort();},5000);
    try{var res=await w.fetch(u.href,{cache:'no-store',signal:ctrl.signal});if(!res.ok)throw new Error('Prístup do Garáže sa nepodarilo overiť.');var snap=await res.json();if(epoch!==generation)throw new Error('Prihlásenie sa zmenilo.');
      if(snap&&snap.ok){if(!snap.me||String(snap.me.id||'').trim().toLowerCase()!==owner)throw new Error('Server vrátil údaje iného používateľa.');return true;}
      if(snap&&snap.code==='NOT_MEMBER')return false;throw new Error(snap&&snap.error||'Prístup do Garáže sa nepodarilo overiť.');
    }finally{clearTimeout(timer);controllers.delete(ctrl);}
  }
  async function transport(action,payload,options){
    if(['getGarage','garageAction','garageRegisterPush','garageDrainPush'].indexOf(action)<0)throw new Error('Nepodporovaná akcia Garáže.');
    var auth=source(),s=auth.session,epoch=generation,opt=options||{},ctrl=new AbortController();
    if(w.navigator&&w.navigator.onLine===false)throw new Error('Si offline. Pripoj sa, aby sa zmena uložila.');
    var u=new URL(w.SCRIPT_URL,w.location.href);u.searchParams.set('action',action);u.searchParams.set('token',w.API_TOKEN);
    u.searchParams.set('username',s.username);u.searchParams.set('device_id',s.device_id||w.authDeviceId());u.searchParams.set('session_token',s.session_token);u.searchParams.set('garage_source_line',auth.line);
    if(action==='getGarage'){u.searchParams.set('_garage',String(Date.now()));if(opt.fresh)u.searchParams.set('fresh','1');}
    var init={method:action==='getGarage'?'GET':'POST',cache:'no-store',signal:ctrl.signal};
    if(init.method==='POST'){init.headers={'Content-Type':'text/plain;charset=utf-8'};init.body=JSON.stringify(payload||{});}
    function cancel(){ctrl.abort();}if(opt.signal){if(opt.signal.aborted)cancel();else opt.signal.addEventListener('abort',cancel,{once:true});}
    controllers.add(ctrl);if(action==='garageAction')saving++;var timer=setTimeout(cancel,25000);
    try{
      var res=await w.fetch(u.href,init);if(!res.ok)throw new Error('Server Garáže neodpovedal. Skús obnoviť údaje.');
      var data=await res.json();if(epoch!==generation||id(me())!==auth.owner)throw new Error('Prihlásený používateľ sa zmenil.');
      if(!data||data.ok!==true){var message=data&&data.error||'Garáž sa nepodarilo načítať. Skús znova.';if(/unknown action|unsupported.*action/i.test(message))message='Garáž ešte nie je nasadená na serveri. Správca musí aktualizovať Golem Apps Script.';var e=new Error(message);e.code=data&&data.code;throw e;}
      var snap=action==='getGarage'?data:data.snapshot;if(snap&&(!snap.me||String(snap.me.id||'').trim().toLowerCase()!==auth.owner))throw new Error('Server vrátil údaje iného používateľa. Prihlás sa znova.');
      // Notification delivery runs in a different request AFTER the committed
      // snapshot arrives. The server's minute trigger retries an interrupted drain.
      if(action==='garageAction'&&data.pushPending)transport('garageDrainPush',{},{}).catch(function(){});
      return data;
    }catch(e){if(e.name==='AbortError')throw new Error('Spojenie sa prerušilo alebo trvalo príliš dlho. Skús znova.');throw e;}
    finally{if(action==='garageAction')saving--;clearTimeout(timer);controllers.delete(ctrl);if(opt.signal)opt.signal.removeEventListener('abort',cancel);}
  }
  function targets(){
    var s=me();if(!s)return [];var out=[];
    if(!officeOnly(s)){
      var dual=typeof w.mgrGetDual==='function'?w.mgrGetDual():null,owner=id(s),labels={gp:'Golem',gyn:'Gynekológia',reagila:'Reagila'};
      ['gp','gyn','reagila'].forEach(function(line){if(line===(s.line||'gp')||(dual&&id(dual)===owner&&alive(dual[line],owner)))out.push({line:line,label:labels[line],short:line==='gp'?'Gol':line==='gyn'?'Gyn':'Rea'});});
    }
    if(canAccess())out.push({line:'garage',label:'Garáž',short:'Garáž'});return out;
  }
  async function registerPush(){
    if(pushPromise)return pushPromise;
    pushPromise=(async function(){
      if(!w.pushSupported||!w.pushSupported())throw new Error('Tento prehliadač nepodporuje upozornenia. Na iPhone otvor Satori z plochy.');
      var owner=id(me()),permission=await w.Notification.requestPermission();if(permission!=='granted')throw new Error('Upozornenia nie sú povolené. Povoliť ich môžeš v nastaveniach telefónu.');
      if(!w.pushInit())throw new Error('Upozornenia sa nepodarilo pripraviť. Skús znova.');
      var reg=await w.navigator.serviceWorker.register('./firebase-messaging-sw.js',{scope:'./fcm-scope/'});
      var token=await w._fcmMessaging.getToken({vapidKey:w.PUSH_VAPID,serviceWorkerRegistration:reg});
      if(!token||owner!==id(me()))throw new Error('Prihlásenie sa zmenilo. Skús znova.');
      return transport('garageRegisterPush',{token:token,device_id:me().device_id||w.authDeviceId()});
    })();try{return await pushPromise;}finally{pushPromise=null;}
  }
  function configure(){
    if(configured||!w.SatoriGarage)return;configured=true;
    w.SatoriGarage.configure({transport:transport,getSession:me,getLineTargets:targets,switchLine:function(line){if(line==='garage')return open();if(officeOnly())return;if(resumeMedical(line))return;close();if(line===(me().line||'gp'))return;w.mgrSwitchLine(line);},exit:function(){if(!resumeMedical((me()&&me().line)||'gp'))close();},logout:function(){w.doLogout();},registerPush:registerPush});
  }
  function resumeMedical(line){
    var s=me();if(!s||!s.garage_start||officeOnly(s))return false;
    var dual=typeof w.mgrGetDual==='function'?w.mgrGetDual():null,target=(s.line||'gp')===line?s:(dual&&id(dual)===id(s)?dual[line]:null);
    if(!target||!alive(target,id(s)))return false;
    target=Object.assign({},target);delete target.garage_start;close();w.setSession(target);w.initLogin();return true;
  }
  function open(options){
    if(!canAccess())return false;configure();if(!w.SatoriGarage)return false;
    if(typeof w.closeViac==='function')w.closeViac();
    if(typeof w.satoriGuideHideHint==='function')w.satoriGuideHideHint();
    if(typeof w.hdrAvatarDismissTip==='function')w.hdrAvatarDismissTip();
    w.SatoriGarage.open(options||{});return true;
  }
  function close(){if(w.SatoriGarage)w.SatoriGarage.close();}
  function isOpen(){return !!(w.SatoriGarage&&w.SatoriGarage.isOpen());}
  function reset(){generation++;controllers.forEach(function(ctrl){ctrl.abort();});controllers.clear();if(w.SatoriGarage)w.SatoriGarage.reset();}
  function bootstrap(s){
    configure();if(!officeOnly(s)&&!(s&&s.garage_start&&canAccess(s))){
      try{var query=new URL(w.location.href).searchParams,key=id(s)+'|'+generation+'|'+(query.get('date')||'');if(query.get('garage')==='1'&&canAccess(s)&&pendingLink!==key){pendingLink=key;setTimeout(function(){if(id(me())===id(s))open({date:query.get('date')||''});},600);}}catch(e){}return false;
    }
    if(typeof w.loginScreenSetExclusive==='function')w.loginScreenSetExclusive(false);
    var login=w.document.getElementById('login-screen');if(login)login.classList.remove('show');
    if(typeof w.bootLoaderDone==='function')w.bootLoaderDone();
    if(officeOnly(s))w.document.body.classList.add('garage-office-only');
    open();return true;
  }
  function handlePush(payload){var d=payload&&payload.data||{};if(d.line!=='garage'&&!/^garage_/.test(String(d.kind||'')))return false;if(!canAccess())return true;
    var owner=id(me()),key=owner+'|'+String(d.kind||'');
    if(/^garage_/.test(String(d.kind||''))){
      if(seenPush[key])return true;seenPush[key]=true;
      try{var storageKey='satori_garage_push_seen_'+owner,ids=JSON.parse(w.localStorage.getItem(storageKey)||'[]');if(ids.indexOf(d.kind)>=0)return true;ids.push(d.kind);w.localStorage.setItem(storageKey,JSON.stringify(ids.slice(-200)));}catch(e){}
    }
    if(d.link){try{d=Object.assign({},d,{date:new URL(d.link,w.location.href).searchParams.get('date')||d.date});}catch(e){}}
    if(w.SatoriGarage)w.SatoriGarage.handlePush(d);
    if(typeof w.pushShowForegroundBanner==='function')w.pushShowForegroundBanner(d.title||'Garáž',d.body||'V Garáži sa zmenili rezervácie.');return true;
  }
  w.SatoriGarageBridge={canAccess:canAccess,canAccessSession:canAccessSession,checkLoginAccess:checkLoginAccess,resumeMedical:resumeMedical,officeOnly:officeOnly,open:open,close:close,isOpen:isOpen,isSaving:function(){return saving>0;},reset:reset,bootstrap:bootstrap,handlePush:handlePush,transport:transport,targets:targets};
  configure();
  if(w.document&&typeof w._backRegister==='function'){
    w._backRegister('satori-garage',function(){if(w.SatoriGarage&&typeof w.SatoriGarage.back==='function')w.SatoriGarage.back();else if(!officeOnly())close();},function(){var modal=w.document.getElementById('logout-overlay');if(modal&&modal.classList.contains('show'))return false;return isOpen();});
    // It sits above the previous medical view, which may retain its show class underneath.
    if(w._backLayers&&w._backLayers.length)w._backLayers.unshift(w._backLayers.pop());
  }
})(window);
