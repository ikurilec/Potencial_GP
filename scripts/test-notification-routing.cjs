const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const backend=process.env.SATORI_BACKEND_DIR||path.resolve('../..','apps_script');
function fn(src,name){const start=src.indexOf('function '+name+'(');assert.ok(start>=0,name);const end=src.indexOf('\n}',start);return src.slice(start,end+2);}
for(const [file,line,prefix] of [['KOD_GOLEM.txt','gp','gp'],['KOD_GYN.txt','gyn','gyn'],['KOD_REAGILA.txt','reagila','gp']]){
 const src=fs.readFileSync(path.join(backend,file),'utf8'),roles=['admin','boss','bum','pm','am west','am east','am','rep west','rep east','kam','asistent'];
 const rows=roles.map((r,i)=>['u'+i,line,'token'+i,r]).concat([['other','other-line','token-other','rep'],['author',line,'token-author','rep']]);
 let calls=[],deleted=[];const sheet={getLastRow:()=>rows.length+1,getRange:()=>({getValues:()=>rows}),deleteRow:r=>deleted.push(r)};
 const c={PUSH_LINE:line,NST_APP_URL_:'https://satori.test/',pushTokenSheet_:()=>sheet,pushSendRows_:(ss,r,l,t,b,url,event)=>{calls.push({r,l,event});return {sent:r.length};},pushSendToLogin_:(ss,l,login,t,b,url,event)=>calls.push({login,l,event}),nstMutedLogins_:()=>({u2:true}),nstMentionList_:s=>s.split(',').filter(Boolean),pushTeamAbsenceMutedLogins_:()=>({u3:true}),Logger:{log:()=>{}},FCM_PROJECT_ID:'test',fcmGetAccessToken_:()=> 'synthetic',pushLogDelivery_:()=>{}};
 c[prefix+'CalApproverLogins_']=()=>['u4','u5'];c.gynFindAmLogins_=()=>['u4','u5'];c[prefix+'UserPref_']=()=>true;c[prefix+'FmtRangeSk_']=()=> 'range';c[prefix.toUpperCase()+'_CAL_ABSENCE']={dovolenka:1,ocr:1,paragraf:1,administrativa:1,nahradne_volno:1};c[prefix.toUpperCase()+'_CAL_TYPE_LABELS']={dovolenka:'Dovolenka'};
 vm.createContext(c);
 vm.runInContext(fn(src,'pushMessagePayload_'),c);
 const payload=c.pushMessagePayload_('synthetic','title','body','https://satori.test/?cal=1','absence_request',line);
 assert.equal(payload.message.data.line,line);assert.equal(new URL(payload.message.data.link).searchParams.get('pushline'),line);
 c.pushMutedLoginsByPref_=()=>({u2:true});
 for(const name of ['calNotifyEvent_','nstPushLineExcept_',prefix+'CalNotifyTeam_',prefix+'CalAbsenceChanged_',prefix+'CalNotifyOnChange_',prefix+'CalNotifyDeleted_'])vm.runInContext(fn(src,name),c);
 c.nstPushLineExcept_({},line,'author','title','body','link','board_post');assert.equal(calls[0].r.length,roles.length-1);assert.ok(calls[0].r.every(x=>x.token!=='token-other'&&x.token!=='token-author'&&x.token!=='token2'));
 c.nstKatLabel_=()=> 'Info';c.nstFindRow_=()=>({vals:[0,0,0,0,'u0']});c.nstRows_=()=>['u1','u2','u3','author'].map((login,i)=>{const r=[];r[0]='comment'+i;r[2]='comment';r[3]='post';r[4]=login;return r;});
 vm.runInContext(fn(src,'nstNotifyActivity_'),c);calls=[];
 c.nstNotifyActivity_({}, {}, {typ:'comment',postId:'post',actor:'author',who:'Author',text:'Comment',replyLogin:'u1',mentions:['u0','u2']});
 assert.deepEqual(calls.map(x=>x.login).sort(),['u0','u1','u3'],'Post owner, reply recipient and participants receive one message; author and muted user excluded');
 calls=[];const ev={type:'dovolenka',owner:'author',ownerName:'Author',status:'pending',dateStart:'2026-10-12',dateEnd:'2026-10-13'};
 c[prefix+'CalNotifyOnChange_']({},ev,null,'author');assert.deepEqual(calls.map(x=>x.login),['u4','u5']);
 calls=[];c[prefix+'CalNotifyOnChange_']({},{...ev,dateStart:'2026-10-14'},ev,'author');assert.equal(calls.length,2,'Edited pending request must notify approvers');
 calls=[];c[prefix+'CalNotifyOnChange_']({},{...ev,status:'approved'},ev,'u4');assert.ok(calls.some(x=>x.login==='author'&&x.event==='absence_decision'));assert.ok(calls.some(x=>x.event==='team_absence_added'));
 assert.ok(calls.find(x=>x.r).r.every(x=>x.token!=='token-other'&&x.token!=='token-author'&&x.token!=='token3'));
 calls=[];const approved={...ev,status:'approved',timeStart:'08:00'};c[prefix+'CalNotifyOnChange_']({},{...approved,timeStart:'12:00'},approved,'author');assert.ok(calls.some(x=>x.event==='team_absence_changed'),'Changed absence hours must notify');
 calls=[];c[prefix+'CalNotifyDeleted_']({},approved,'u4');assert.ok(calls.some(x=>x.login==='author'));assert.ok(calls.some(x=>x.event==='team_absence_cancelled'));
 calls=[];c[prefix+'CalNotifyOnChange_']({},{...ev,status:'rejected'},ev,'u4');assert.equal(calls.length,1,'Rejected request stays private');
 calls=[];const corporate={type:'miting',owner:'author',status:'approved',title:'Meeting',dateStart:'2026-10-14',visibility:'custom',recipients:['u0','u1','u2']};
 c[prefix+'CalNotifyOnChange_']({},corporate,null,'author');assert.deepEqual(Array.from(calls[0].r,x=>x.token),['token0','token1'],'Custom event only notifies explicit recipients and respects preferences');assert.equal(calls[0].event,'calendar_added');
 calls=[];c[prefix+'CalNotifyOnChange_']({},corporate,corporate,'author');assert.equal(calls.length,0,'Unchanged save does not send duplicate alert');
 calls=[];c[prefix+'CalNotifyOnChange_']({},{...corporate,title:'Changed'},corporate,'author');assert.equal(calls[0].event,'calendar_changed');
 calls=[];c[prefix+'CalNotifyDeleted_']({},corporate,'author');assert.equal(calls[0].event,'calendar_deleted');
 calls=[];c[prefix+'CalNotifyOnChange_']({},{...corporate,visibility:'private'},null,'author');assert.equal(calls[0].r.length,0,'Private event never broadcasts to other roles');
 calls=[];c[prefix+'CalNotifyOnChange_']({},{...corporate,type:'poznamka',visibility:'all'},null,'author');assert.equal(calls.length,0,'Personal note is not a team notification');
 // A permission/payload/server error is not proof that a device token expired.
 c.pushMessagePayload_=()=>({});c.UrlFetchApp={fetchAll:()=>[400,403,404,404,503].map((code,i)=>({getResponseCode:()=>code,getContentText:()=>JSON.stringify({error:{details:i===3?[{'@type':'type.googleapis.com/google.firebase.fcm.v1.FcmError',errorCode:'UNREGISTERED'}]:[]}})}))};
 vm.runInContext(fn(src,'pushSendRows_'),c);c.pushSendRows_({},[2,3,4,5,6].map(rowIdx=>({rowIdx,token:'synthetic'})),line,'t','b','l','test','test');
 assert.deepEqual(deleted,[5],'Only confirmed UNREGISTERED token is removed');
 new vm.Script(src,{filename:file});
 console.log(file+': all roles, line/mute/author isolation, absence transitions and token retention passed');
}
