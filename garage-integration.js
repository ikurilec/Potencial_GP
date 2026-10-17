/* Garáž is a virtual Satori interface; the authenticated medical session stays intact. */
(function (w) {
  'use strict';
  var configured=false, generation=0, controllers=new Set(), pushPromise=null, seenPush={}, pendingLink='', saving=0, grants=new Map(), restorePromise=null, accessProbes=new Map(), accessChecks=new Map();
  function me(){return typeof w.getSession==='function'?w.getSession():null;}
  function id(s){return String(s&&s.username||'').trim().toLowerCase();}
  function role(s){return String(s&&s.role||'').trim().toLowerCase().replace(/[_-]+/g,' ').replace(/\s+/g,' ');}
  function officeOnly(s){s=s||me();return /^(office|office user|fleet|fleet manager|parking manager|garaz|garáž)$/.test(role(s));}
  function grantKey(s,line){return JSON.stringify([id(s),line||s.line||'gp',s.session_token||'',s.device_id||'']);}
  function canAccessSession(s){return !!(s&&alive(s,id(s))&&s.garage_access===true&&grants.get(grantKey(s))===true);}
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
  function applyAccessRecord(record,allowed){
    var active=me(),dual=typeof w.mgrGetDual==='function'?w.mgrGetDual():null;
    function update(data,line){if(!data||id(data)&&id(data)!==record.owner||grantKey(Object.assign({},data,{username:record.owner}),line)!==record.key)return false;data.garage_access=allowed===true;if(allowed||record.status==='denied')delete data.garage_error;else data.garage_error=record.error;return true;}
    if(active&&id(active)===record.owner&&update(active,active.line||'gp')&&typeof w.setSession==='function')w.setSession(active);
    if(dual&&id(dual)===record.owner){['gp','gyn','reagila'].forEach(function(line){update(dual[line],line);});if(typeof w.mgrSetDual==='function')w.mgrSetDual(dual);}
    var ctx=w._lineChooserCtx;if(ctx&&String(ctx.username).toLowerCase()===record.owner)['gp','gyn','reagila'].forEach(function(line){update(ctx.data[line],line);});
  }
  function accessCandidates(username,dataMap){
    var active=me(),ctx=w._lineChooserCtx,owner=String(username||id(active)||ctx&&ctx.username||'').trim().toLowerCase(),out=new Map();
    function add(line,data){if(!data||id(data)&&id(data)!==owner)return;var candidate=Object.assign({},data,{username:owner,line:line,ok:true});if(!alive(candidate,owner))return;var key=grantKey(candidate,line);out.set(key,{line:line,data:candidate,key:key});}
    if(dataMap)['gp','gyn','reagila'].forEach(function(line){add(line,dataMap[line]);});
    else {if(active&&id(active)===owner)add(active.line||'gp',active);var dual=typeof w.mgrGetDual==='function'?w.mgrGetDual():null;if(dual&&id(dual)===owner)['gp','gyn','reagila'].forEach(function(line){add(line,dual[line]);});if(ctx&&String(ctx.username).toLowerCase()===owner)['gp','gyn','reagila'].forEach(function(line){add(line,ctx.data[line]);});}
    return Array.from(out.values());
  }
  var ACCESS_HINT_PREFIX='satori_garage_access_hint_v1_';
  // Layout hint only: never used by canAccessSession, source or transport.
  function rememberAccessHint(owner,line,allowed){try{w.localStorage.setItem(ACCESS_HINT_PREFIX+line+'_'+owner,JSON.stringify({allowed:allowed===true,checkedAt:Date.now()}));}catch(e){}}
  function knownAccessHint(owner,line){try{
    var raw=w.localStorage.getItem(ACCESS_HINT_PREFIX+line+'_'+owner),now=Date.now(),ttl=30*86400000;
    if(raw){var hint=JSON.parse(raw);return hint.allowed===true&&Number(hint.checkedAt)>0&&now>=Number(hint.checkedAt)&&now-Number(hint.checkedAt)<ttl;}
    // Migrate the display hint from an existing Garage cache after the update.
    var saved=JSON.parse(w.localStorage.getItem('satori_garage_snapshot_v1_'+owner)||'null'),member=saved&&saved.snapshot&&saved.snapshot.me,binding=saved&&saved.snapshot&&Array.isArray(saved.snapshot.members)&&saved.snapshot.members.find(function(m){return m.id===owner;});
    return !!(saved&&saved.snapshot.ok&&member&&member.id===owner&&member.access!==false&&binding&&binding.sourceLine===line&&binding.active!==false&&binding.access!==false&&Number(saved.savedAt)>0&&now>=Number(saved.savedAt)&&now-Number(saved.savedAt)<ttl);
  }catch(e){return false;}}
  function accessUiState(username,dataMap){var rows=accessCandidates(username,dataMap),records=rows.map(function(row){return accessChecks.get(row.key);}).filter(Boolean),known=rows.some(function(row){var record=accessChecks.get(row.key);return (!record||record.status!=='denied')&&knownAccessHint(id(row.data),row.line);});if(records.some(function(r){return r.status==='allowed';}))return {status:'allowed',known:true};// While a check is running or failed the Garage tile is always shown (disabled): the hint only matters before a check starts.
    if(records.some(function(r){return r.status==='checking';}))return {status:'checking',known:true};if(records.some(function(r){return r.status==='failed';}))return {status:'failed',known:true};return {status:'unknown',known:known};}
  function retryAccess(){var active=me(),key=active&&grantKey(active),epoch=generation,rows=accessCandidates().filter(function(row){var r=accessChecks.get(row.key);return r&&r.status==='failed';});return Promise.allSettled(rows.map(function(row){return checkLoginAccess(id(row.data),row.line,row.data);})).then(function(results){var current=me();if(rows.length&&epoch===generation&&key&&current&&grantKey(current)===key&&officeOnly(current)&&canAccess()&&!isOpen())bootstrap(current);return results;});}
  async function checkLoginAccess(username,line,data){
    var owner=String(username||'').trim().toLowerCase(),s=Object.assign({},data,{username:owner,line:line});
    if(!owner||!data||!data.ok||!alive(s,owner)||['gp','gyn','reagila'].indexOf(line)<0)return false;
    var key=grantKey(s,line),epoch=generation;data.garage_access=false;
    if(accessProbes.has(key)){var existing=await accessProbes.get(key);if(epoch!==generation)throw new Error('Prihlásenie sa zmenilo.');data.garage_access=existing;return existing;}
    grants.delete(key);var record={key:key,owner:owner,line:line,status:'checking',error:''};accessChecks.set(key,record);refreshAccessUi();
    async function attempt(timeout){
      var ctrl=new AbortController(),u=new URL(w.SCRIPT_URL,w.location.href);u.searchParams.set('action','getGarage');u.searchParams.set('token',w.API_TOKEN);u.searchParams.set('username',owner);u.searchParams.set('device_id',data.device_id||w.authDeviceId());u.searchParams.set('session_token',data.session_token);u.searchParams.set('garage_source_line',line);u.searchParams.set('_garage',String(Date.now()));
      controllers.add(ctrl);var timer=setTimeout(function(){ctrl.abort();},timeout);
      try{var res=await w.fetch(u.href,{cache:'no-store',signal:ctrl.signal});if(epoch!==generation)throw Object.assign(new Error('Prihlásenie sa zmenilo.'),{terminal:true});if(!res.ok)throw Object.assign(new Error('Prístup do Garáže sa nepodarilo overiť.'),{terminal:res.status>=400&&res.status<500&&res.status!==429});var snap=await res.json();if(epoch!==generation)throw Object.assign(new Error('Prihlásenie sa zmenilo.'),{terminal:true});
        if(snap&&snap.ok){if(!snap.me||String(snap.me.id||'').trim().toLowerCase()!==owner)throw Object.assign(new Error('Server vrátil údaje iného používateľa.'),{terminal:true});return true;}
        if(snap&&snap.code==='NOT_MEMBER')return false;var message=snap&&snap.error||'Prístup do Garáže sa nepodarilo overiť.',terminal=/unknown action|unsupported.*action|session|forbidden|unauthori[sz]ed|prihlás/i.test(message)||/^(UNKNOWN_ACTION|UNAUTHORIZED|SESSION_EXPIRED|IDENTITY_MISMATCH)$/.test(snap&&snap.code||'');if(/unknown action|unsupported.*action/i.test(message))message='Garáž ešte nie je nasadená na serveri. Správca musí aktualizovať Golem Apps Script.';throw Object.assign(new Error(message),{terminal:terminal});
      }finally{clearTimeout(timer);controllers.delete(ctrl);}
    }
    var task=(async function(){try{var allowed;try{allowed=await attempt(10000);}catch(e){if(epoch!==generation||e.terminal)throw e;allowed=await attempt(20000);}if(epoch!==generation)throw new Error('Prihlásenie sa zmenilo.');record.status=allowed?'allowed':'denied';rememberAccessHint(owner,line,allowed);if(allowed)grants.set(key,true);else grants.delete(key);data.garage_access=allowed;applyAccessRecord(record,allowed);refreshAccessUi();return allowed;
      }catch(e){if(epoch!==generation)throw new Error('Prihlásenie sa zmenilo.');record.status='failed';record.error=e.name==='AbortError'?'Prístup do Garáže sa nepodarilo overiť. Skontroluj spojenie a skús znova.':e.message;data.garage_error=record.error;applyAccessRecord(record,false);refreshAccessUi();throw new Error(record.error);}
    })();accessProbes.set(key,task);try{return await task;}finally{if(accessProbes.get(key)===task)accessProbes.delete(key);}
  }
  async function transport(action,payload,options){
    if(['getGarage','getGarageUsers','garageAction','garageRegisterPush','garageDrainPush'].indexOf(action)<0)throw new Error('Nepodporovaná akcia Garáže.');
    var auth=source(),s=auth.session,epoch=generation,opt=options||{},ctrl=new AbortController();
    auth.key=grantKey(s,auth.line);
    if(w.navigator&&w.navigator.onLine===false)throw new Error('Si offline. Pripoj sa, aby sa zmena uložila.');
    var u=new URL(w.SCRIPT_URL,w.location.href);u.searchParams.set('action',action);u.searchParams.set('token',w.API_TOKEN);
    u.searchParams.set('username',s.username);u.searchParams.set('device_id',s.device_id||w.authDeviceId());u.searchParams.set('session_token',s.session_token);u.searchParams.set('garage_source_line',auth.line);
    var read=action==='getGarage'||action==='getGarageUsers';
    if(read){u.searchParams.set('_garage',String(Date.now()));if(opt.fresh)u.searchParams.set('fresh','1');}
    var init={method:read?'GET':'POST',cache:'no-store',signal:ctrl.signal};
    if(init.method==='POST'){init.headers={'Content-Type':'text/plain;charset=utf-8'};init.body=JSON.stringify(payload||{});}
    function cancel(){ctrl.abort();}if(opt.signal){if(opt.signal.aborted)cancel();else opt.signal.addEventListener('abort',cancel,{once:true});}
    controllers.add(ctrl);if(action==='garageAction')saving++;var timer=setTimeout(cancel,25000);
    try{
      var res=await w.fetch(u.href,init);if(!res.ok)throw new Error('Server Garáže neodpovedal. Skús obnoviť údaje.');
      var data=await res.json();if(epoch!==generation||id(me())!==auth.owner||!currentSource(auth))throw new Error('Prihlásený používateľ sa zmenil.');
      if(!data||data.ok!==true){if(data&&data.code==='NOT_MEMBER')revoke(auth.owner);var message=data&&data.error||'Garáž sa nepodarilo načítať. Skús znova.';if(/unknown action|unsupported.*action/i.test(message))message='Garáž ešte nie je nasadená na serveri. Správca musí aktualizovať Golem Apps Script.';var e=new Error(message);e.code=data&&data.code;throw e;}
      var snap=action==='getGarage'?data:data.snapshot;if(snap&&(!snap.me||String(snap.me.id||'').trim().toLowerCase()!==auth.owner))throw new Error('Server vrátil údaje iného používateľa. Prihlás sa znova.');
      // Notification delivery runs in a different request AFTER the committed
      // snapshot arrives. The server's minute trigger retries an interrupted drain.
      if(action==='garageAction'&&data.pushPending)transport('garageDrainPush',{},{}).catch(function(){});
      return data;
    }catch(e){if(e.name==='AbortError')throw new Error('Spojenie sa prerušilo alebo trvalo príliš dlho. Skús znova.');throw e;}
    finally{if(action==='garageAction')saving--;clearTimeout(timer);controllers.delete(ctrl);if(opt.signal)opt.signal.removeEventListener('abort',cancel);}
  }
  function currentSource(auth){var s=me(),dual=typeof w.mgrGetDual==='function'?w.mgrGetDual():null;return !!(s&&((s.line||'gp')===auth.line&&grantKey(s)===auth.key||dual&&id(dual)===auth.owner&&dual[auth.line]&&grantKey(dual[auth.line],auth.line)===auth.key));}
  function refreshAccessUi(){try{if(typeof w.mgrRenderLineSwitch==='function')w.mgrRenderLineSwitch();if(typeof w.viacRender==='function'&&w.document.getElementById('viac-overlay')&&w.document.getElementById('viac-overlay').classList.contains('show'))w.viacRender();var ctx=w._lineChooserCtx;if(ctx&&typeof w.showLineChooser==='function')w.showLineChooser(ctx.username,ctx.lines.filter(function(line){return line!=='garage';}),ctx.data,ctx.pending,ctx.failed);}catch(e){}}
  function revoke(owner){
    ['gp','gyn','reagila'].forEach(function(line){rememberAccessHint(owner,line,false);});
    finishGarageBoot(garageBoot);generation++;restorePromise=null;accessProbes.clear();accessChecks.clear();controllers.forEach(function(ctrl){ctrl.abort();});
    grants.forEach(function(value,key){if(JSON.parse(key)[0]===owner)grants.delete(key);});
    var s=me(),dual=typeof w.mgrGetDual==='function'?w.mgrGetDual():null,resume=!!(s&&s.garage_start&&!officeOnly(s));
    if(s&&id(s)===owner){s.garage_access=false;delete s.garage_start;if(typeof w.setSession==='function')w.setSession(s);}
    if(dual&&id(dual)===owner){['gp','gyn','reagila'].forEach(function(line){if(dual[line]&&id(dual[line])===owner){dual[line].garage_access=false;delete dual[line].garage_start;}});if(typeof w.mgrSetDual==='function')w.mgrSetDual(dual);}
    if(w.SatoriGarage)w.SatoriGarage.reset();w.document.body.classList.remove('garage-office-only');refreshAccessUi();
    if(officeOnly(s))loginError('Nemáš aktívny prístup do Garáže. Obráť sa na správcu.');
    else if(resume&&typeof w.initLogin==='function')w.initLogin(true);
  }
  var garageBoot=null;
  function finishGarageBoot(boot,message){if(!boot||garageBoot!==boot)return;garageBoot=null;if(typeof w.bootLoaderDone==='function')w.bootLoaderDone();const msg=w.document.getElementById('boot-loader-msg');if(msg&&message)msg.textContent=message;else if(msg&&w.SatoriGarage&&w.SatoriGarage.isOpen()&&w.SatoriGarage.getSnapshot&&!w.SatoriGarage.getSnapshot())msg.textContent='Garáž sa nepodarilo načítať. Údaje môžete skúsiť obnoviť.';}
  function startGarageBoot(s){const key=grantKey(s);if(garageBoot&&garageBoot.owner===id(s)&&garageBoot.epoch===generation&&garageBoot.key===key)return garageBoot;if(garageBoot)finishGarageBoot(garageBoot);const boot={owner:id(s),epoch:generation,key:key};garageBoot=boot;if(typeof w.bootLoaderShow==='function')w.bootLoaderShow(true);const msg=w.document.getElementById('boot-loader-msg');if(msg)msg.textContent='Pripravujem Garáž…';return boot;}
  function garageBootPainted(data){const boot=garageBoot;if(boot&&data&&data.me&&id(me())===boot.owner&&data.me.id===boot.owner&&boot.epoch===generation&&grantKey(me())===boot.key)finishGarageBoot(boot);}
  function loginError(message){if(typeof w.loginScreenSetExclusive==='function')w.loginScreenSetExclusive(true);var login=w.document.getElementById('login-screen');if(login)login.classList.add('show');var error=w.document.getElementById('login-err');if(error){error.textContent=message;error.classList.add('show');}if(garageBoot)finishGarageBoot(garageBoot,message);else if(typeof w.bootLoaderDone==='function')w.bootLoaderDone();}
  function restore(s,continuation){
    var hold=officeOnly(s)||!!s.garage_start;if(restorePromise)return hold;
    var epoch=generation,owner=id(s),originalKey=grantKey(s),dual=typeof w.mgrGetDual==='function'?w.mgrGetDual():null,list=[{line:s.line||'gp',session:s}],lastError='';
    if(dual&&id(dual)===owner)['gp','gyn','reagila'].forEach(function(line){if(line!==(s.line||'gp')&&alive(dual[line],owner))list.push({line:line,session:dual[line]});});
    list.forEach(function(item){item.session.garage_access=false;grants.delete(grantKey(item.session,item.line));});if(typeof w.setSession==='function')w.setSession(s);if(dual&&id(dual)===owner&&typeof w.mgrSetDual==='function')w.mgrSetDual(dual);
    if(hold)startGarageBoot(s);
    if(hold&&typeof w.loginScreenSetExclusive==='function')w.loginScreenSetExclusive(true);
    var task=Promise.allSettled(list.map(function(item){var data=Object.assign({},item.session,{ok:true});return checkLoginAccess(owner,item.line,data).then(function(allowed){if(epoch!==generation||grantKey(me()||{})!==originalKey)return;item.session.garage_access=allowed;}).catch(function(e){lastError=e.message;});})).then(function(){
      if(epoch!==generation||grantKey(me()||{})!==originalKey)return;
      var active=me();active.garage_access=s.garage_access;w.setSession(active);if(dual&&id(dual)===owner&&typeof w.mgrSetDual==='function')w.mgrSetDual(dual);refreshAccessUi();
      if(!hold)return;
      if(canAccess()&&bootstrap(active))return;
      if(officeOnly(active)){loginError(lastError||'Nemáš aktívny prístup do Garáže. Obráť sa na správcu.');return;}
      finishGarageBoot(garageBoot);delete active.garage_start;w.setSession(active);continuation();
    });restorePromise=task;task.finally(function(){if(restorePromise===task)restorePromise=null;});return hold;
  }
  function users(force){return transport('getGarageUsers',{}, {fresh:force!==false});}
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
    w.SatoriGarage.configure({transport:transport,loadUsers:function(){return users(true);},getSession:me,getLineTargets:targets,sharedOverlayOpen:sharedOverlayOpen,headerMarkup:function(data,s){return w.SatoriGarageShell?w.SatoriGarageShell.headerMarkup(data,s):'';},afterRender:function(data){if(w.SatoriGarageShell)w.SatoriGarageShell.afterRender();garageBootPainted(data);},switchLine:function(line){if(line==='garage')return open();if(officeOnly())return;if(resumeMedical(line))return;close();if(line===(me().line||'gp'))return;w.mgrSwitchLine(line);},exit:function(){if(!resumeMedical((me()&&me().line)||'gp'))close();},logout:function(){w.doLogout();},registerPush:registerPush});
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
    const boot=garageBoot;try{const opened=w.SatoriGarage.open(options||{});if(boot)Promise.resolve(opened).then(function(){finishGarageBoot(boot);},function(){finishGarageBoot(boot);});}catch(e){finishGarageBoot(boot);throw e;}return true;
  }
  function close(){finishGarageBoot(garageBoot);if(w.SatoriGarage)w.SatoriGarage.close();}
  function isOpen(){return !!(w.SatoriGarage&&w.SatoriGarage.isOpen());}
  function sharedOverlayOpen(){return ['logout-overlay','settings-overlay','viac-overlay','av-overlay','av-confirm-overlay','pwd-change-overlay'].some(function(id){var modal=w.document.getElementById(id);return modal&&modal.classList.contains('show');});}
  function reset(){finishGarageBoot(garageBoot);generation++;grants.clear();restorePromise=null;accessProbes.clear();accessChecks.clear();controllers.forEach(function(ctrl){ctrl.abort();});controllers.clear();if(w.SatoriGarage)w.SatoriGarage.reset();}
  function bootstrap(s){
    configure();if(!canAccess()||!officeOnly(s)&&!(s&&s.garage_start&&canAccess())){
      try{var query=new URL(w.location.href).searchParams,key=id(s)+'|'+generation+'|'+(query.get('date')||'');if(query.get('garage')==='1'&&canAccess(s)&&pendingLink!==key){pendingLink=key;setTimeout(function(){if(id(me())===id(s))open({date:query.get('date')||''});},600);}}catch(e){}return false;
    }
    startGarageBoot(s);
    if(typeof w.loginScreenSetExclusive==='function')w.loginScreenSetExclusive(false);
    var login=w.document.getElementById('login-screen');if(login)login.classList.remove('show');
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
    if(typeof w.pushShowForegroundBanner==='function'){var gen=generation,isOffer=/^garage_offer(?:_|-)/.test(String(d.kind||''));w.pushShowForegroundBanner(d.title||'Garáž',d.body||'V Garáži sa zmenili rezervácie.',{label:isOffer?'Zobraziť ponuku':'Otvoriť Garáž',onOpen:function(){if(gen===generation&&owner===id(me())&&canAccess())open(isOffer?{view:'offers',date:d.date}:{date:d.date});}});}return true;
  }
  w.SatoriGarageBridge={canAccess:canAccess,canAccessSession:canAccessSession,checkLoginAccess:checkLoginAccess,accessUiState:accessUiState,retryAccess:retryAccess,restore:restore,users:users,resumeMedical:resumeMedical,officeOnly:officeOnly,open:open,close:close,isOpen:isOpen,isSaving:function(){return saving>0;},reset:reset,bootstrap:bootstrap,handlePush:handlePush,transport:transport,targets:targets,registerPush:registerPush};
  configure();
  if(typeof w.addEventListener==='function')w.addEventListener('online',retryAccess);
  if(w.document&&typeof w.document.addEventListener==='function')w.document.addEventListener('visibilitychange',function(){if(!w.document.hidden&&(!w.navigator||w.navigator.onLine!==false))retryAccess();});
  if(w.document&&typeof w._backRegister==='function'){
    w._backRegister('satori-garage',function(){if(w.SatoriGarage&&typeof w.SatoriGarage.back==='function')w.SatoriGarage.back();else if(!officeOnly())close();},function(){return !sharedOverlayOpen()&&isOpen();});
    // It sits above the previous medical view, which may retain its show class underneath.
    if(w._backLayers&&w._backLayers.length)w._backLayers.unshift(w._backLayers.pop());
    w._backRegister('satori-garage-shared',function(){if(w.SatoriGarageShell)w.SatoriGarageShell.handleSharedBack();},function(){return isOpen()&&w.SatoriGarageShell&&w.SatoriGarageShell.sharedOverlayOpen();});
    if(w._backLayers&&w._backLayers.length)w._backLayers.unshift(w._backLayers.pop());
  }
})(window);
