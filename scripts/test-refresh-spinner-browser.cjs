const fs=require('fs'),assert=require('assert/strict');
const {chromium}=require(process.env.SATORI_PLAYWRIGHT || 'playwright-core');
(async()=>{
 const browser=await chromium.launch({headless:true});const page=await browser.newPage();
 await page.setContent('<style>.nst-spin{display:inline-block;width:14px;height:14px;border:2px solid #ddd;border-top-color:blue;border-radius:50%;animation:spin .7s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}</style><div id="host"></div>');
 const src=fs.readFileSync('app.js','utf8');
 await page.addScriptTag({content:'var view={key:"home",host:"#host"};function appReadView(){return view}function appLineContextActive(){return true}'+src.slice(src.indexOf('function appReadPaint('),src.indexOf('function appReadBegin('))});
 const result=await page.evaluate(async()=>{
 const entry={view,ctx:{},pending:1,error:false};appReadPaint(entry);
 const spin=document.querySelector('.nst-spin'),animation=spin.getAnimations()[0];
 const timer=setInterval(()=>appReadPaint(entry),200);
 await new Promise(r=>setTimeout(r,1100));clearInterval(timer);
 return {sameNode:spin===document.querySelector('.nst-spin'),sameAnimation:animation===spin.getAnimations()[0],elapsed:animation.currentTime};
 });
 assert.equal(result.sameNode,true);assert.equal(result.sameAnimation,true);assert.ok(result.elapsed>900,JSON.stringify(result));
 console.log('Browser: spinner node and animation preserved across polling, elapsed='+Math.round(result.elapsed)+'ms');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
