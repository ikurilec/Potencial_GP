'use strict';
// Real built UI in an isolated browser; no production requests or credentials.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Ivan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),server=http.createServer((req,res)=>{let name=decodeURIComponent(req.url.split('?')[0]);if(name.endsWith('/'))name+='index.html';const file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}const ext=path.extname(file);res.setHeader('Content-Type',ext==='.js'?'application/javascript':ext==='.css'?'text/css':ext==='.json'?'application/json':'text/html');res.end(fs.readFileSync(file));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{for(const prefix of ['', 'nahlad/'])for(const width of [390,1280])for(const loginActive of [false,true]){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});await context.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
  const page=await context.newPage();await page.goto(origin+'/'+prefix,{waitUntil:'load'});await page.waitForFunction(()=>typeof appHandleSessionRejection==='function');
  const result=await page.evaluate(loginActive=>{
   loginScreenSetExclusive(loginActive);
   const s={username:'synthetic-fixture',name:'Test používateľ',role:'admin',line:'gp',session_token:'synthetic-token',device_id:'synthetic-device',rememberMe:true,session_expires_at:new Date(Date.now()+3600000).toISOString()};
   setSession(s);for(const id of ['av-overlay','av-confirm-overlay','pwd-change-overlay']){const el=document.getElementById(id);if(el)el.classList.add('show');}
   const u=new URL(SCRIPT_URL);for(const key of ['username','device_id','session_token'])u.searchParams.set(key,s[key]);
   const handled=appHandleSessionRejection(u.href,{ok:false,error:'Session expired'}),modal=document.getElementById('session-expired-overlay'),rect=modal.getBoundingClientRect(),top=document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2);
   return {handled,sessionCleared:getSession()===null,visible:modal.classList.contains('show'),onTop:top===modal||modal.contains(top),debug:{top:top&&top.id,rect:[rect.x,rect.y,rect.width,rect.height],parent:modal.parentElement.id,style:getComputedStyle(modal).zIndex}};
  },loginActive);const {debug,...actual}=result;assert.deepEqual(actual,{handled:true,sessionCleared:true,visible:true,onTop:true},JSON.stringify(debug));
  await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.session-expired-box')).opacity)>.99);
  if(!prefix&&width===390){fs.mkdirSync(path.join(root,'.tmp'),{recursive:true});await page.screenshot({path:path.join(root,'.tmp/password-session-expired-mobile.png')});}
  console.log(prefix+' '+width+' loginActive='+loginActive+': built session revocation clears remembered credentials and covers all editors');await context.close();
 }}finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
