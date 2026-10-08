const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
for(const file of ['app.js','nahlad/app.js']){
 const src=fs.readFileSync(file,'utf8');let element=null,writes=0;
 const parent={querySelector:()=>element,insertBefore:el=>{element=el;}};
 const view={key:'home',host:'#home'};
 const ctx={appReadView:()=>view,appLineContextActive:()=>true,document:{querySelector:()=>({parentNode:parent}),createElement:()=>({setAttribute(){},remove(){element=null;},set innerHTML(v){writes++;this.html=v;}})}};
 vm.createContext(ctx);vm.runInContext(src.slice(src.indexOf('function appReadPaint('),src.indexOf('function appReadBegin(')),ctx);
 const entry={view,ctx:{},pending:1,error:false};
 ctx.appReadPaint(entry);const first=element;
 for(let i=0;i<10;i++)ctx.appReadPaint(entry);
 assert.equal(writes,1,file+': polling must preserve the animated spinner');assert.equal(element,first);
 element=null;ctx.appReadPaint(entry);assert.equal(writes,2,'Restore status after a view redraw');
 entry.pending=0;entry.error=true;ctx.appReadPaint(entry);assert.match(element.html,/Obnova zlyhala/);
 entry.error=false;ctx.appReadPaint(entry);assert.equal(element,null);
 console.log(file+': spinner identity and status transitions passed');
}
