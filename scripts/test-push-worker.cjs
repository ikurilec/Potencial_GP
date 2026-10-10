const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
(async()=>{
 for(const file of ['firebase-messaging-sw.js','nahlad/firebase-messaging-sw.js']){
  let receive,click,shown=[],navigated=[],focused=0;
  const scope='https://satori.test/'+(file.startsWith('nahlad')?'nahlad/':'')+'fcm-scope/';
  const c={URL,Math,Date,Promise,importScripts:()=>{},firebase:{initializeApp:()=>{},messaging:()=>({onBackgroundMessage:fn=>receive=fn})},self:{registration:{scope,showNotification:(t,o)=>{shown.push({t,o});return Promise.resolve();}},addEventListener:(name,fn)=>{if(name==='notificationclick')click=fn;}},clients:{matchAll:()=>Promise.resolve([{url:'https://ikurilec.github.io/Potencial_GP/',navigate:link=>{navigated.push(link);return Promise.resolve({focus:()=>focused++});},focus:()=>focused++}])}};
  vm.createContext(c);vm.runInContext(fs.readFileSync(file,'utf8'),c);
  const payload={data:{title:'Satori',body:'Test',link:'https://ikurilec.github.io/Potencial_GP/?nst=1&post=post&pushline=gyn'}};
  await receive(payload);await receive(payload);assert.equal(shown.length,2);assert.notEqual(shown[0].o.tag,shown[1].o.tag,'Independent alerts must not replace each other');
  const icon=new URL(shown[0].o.icon);assert.equal(icon.pathname,(file.startsWith('nahlad')?'/nahlad':'')+'/satori-notification-icon.png');assert.ok(fs.existsSync(file.startsWith('nahlad')?'nahlad/satori-notification-icon.png':'satori-notification-icon.png'));assert.equal(shown[0].o.badge,shown[0].o.icon);
  let done;click({notification:{close:()=>{},data:shown[0].o.data},waitUntil:p=>done=p});await done;assert.deepEqual(navigated,[payload.data.link]);assert.equal(focused,1);
  console.log(file+': icon, independent alerts and existing-app deep-link navigation passed');
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
