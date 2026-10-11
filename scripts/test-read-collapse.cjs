const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
for(const file of ['app.js','nahlad/app.js']){
 const src=fs.readFileSync(file,'utf8');let now=0,epoch=1,nextTimer=0,view={key:'stocks'},summary,timers=new Map();
 const fresh=()=>({last:100,error:false,groups:[{id:'stocks',last:100,current:true}]});summary=fresh();
 const c={document:{activeElement:null},appReadView:()=>view,appReadSummary:()=>summary,appLineContextActive:ctx=>ctx.epoch===epoch,
  setTimeout:(fn,ms)=>{const id=++nextTimer;timers.set(id,{fn,time:now+ms});return id;},clearTimeout:id=>timers.delete(id)};
 vm.createContext(c);vm.runInContext(src.slice(src.indexOf('var APP_READ_PRESENTATION'),src.indexOf('function appReadRetryCurrent(')),c);
 function tick(ms){now+=ms;for(const [id,t] of [...timers])if(t.time<=now){timers.delete(id);t.fn();}}
 function element(){const classes=new Set(),attrs={},details={open:false};return {style:{},isConnected:true,details,_appReadStatus:'verified',
  classList:{contains:x=>classes.has(x),add:x=>classes.add(x),remove:x=>classes.delete(x)},attrs,
  getBoundingClientRect:()=>({height:92}),setAttribute:(k,v)=>attrs[k]=v,removeAttribute:k=>delete attrs[k],
  querySelector:()=>details,contains:x=>x?.inside===true,addEventListener(){}};}
 function paint(el,entry,status='verified'){el._appReadStatus=status;c.appReadCollapseUpdate(el,entry,summary,status);}
 let el=element(),entry={view,ctx:{epoch}};paint(el,entry);tick(800);paint(el,entry);tick(799);paint(el,entry);
 assert.equal(el.attrs['aria-hidden'],undefined,'Green success stays readable');tick(1);
 assert.equal(el.attrs['aria-hidden'],'true','Repeated paints must not restart the success timer');assert.equal(el.inert,true);
 assert.equal(el.style.height,'92px','Measured starting height allows a real slide/collapse');
 const redraw=element();paint(redraw,entry);assert.equal(redraw.attrs['aria-hidden'],'true','Redraw reuses dismissed success');el=redraw;
 summary.last=200;summary.groups[0].last=200;paint(el,entry);assert.equal(el.attrs['aria-hidden'],'true','Silent timestamp updates do not flash the banner');
 paint(el,entry,'pending');assert.equal(el.attrs['aria-hidden'],undefined);assert.equal(el.style.height,'');assert.equal(el.inert,false);
 paint(el,entry);tick(800);paint(el,entry,'pending');tick(1000);assert.equal(el.attrs['aria-hidden'],undefined,'New loading cancels old collapse timer');
 const incomplete=[{pending:true},{error:true},{last:0},{current:false}];
 for(const change of incomplete){summary=fresh();Object.assign(summary.groups[0],change);paint(el,entry);tick(2200);assert.equal(el.attrs['aria-hidden'],undefined,'Incomplete/old/failed group stays visible');}
 summary=fresh();summary.groups.push({id:'metadata',required:false,last:0,current:false});paint(el,entry);tick(2200);
 assert.equal(el.attrs['aria-hidden'],undefined,'Even a displayed supplemental section must finish before all-OK dismissal');
 summary=fresh();paint(el,entry);summary.groups[0].pending=true;tick(1600);assert.equal(el.attrs['aria-hidden'],undefined,'Recheck current summary before hiding, not a stale snapshot');
 summary=fresh();el.details.open=true;paint(el,entry);tick(2000);assert.equal(el.attrs['aria-hidden'],undefined,'Expanded details remain visible');
 el.details.open=false;c.document.activeElement={inside:true,matches:()=>true};paint(el,entry);tick(2000);assert.equal(el.attrs['aria-hidden'],undefined,'Keyboard focus is not hidden');
 c.document.activeElement={inside:true,matches:()=>false};paint(el,entry);tick(1600);assert.equal(el.attrs['aria-hidden'],'true','Touch focus after closing details does not prevent dismissal forever');c.document.activeElement=null;
 paint(el,entry,'error');tick(2200);assert.equal(el.attrs['aria-hidden'],undefined,'Error and retry remain visible');
 summary=fresh();paint(el,entry);view={key:'elsewhere'};tick(1600);assert.equal(el.attrs['aria-hidden'],undefined,'A departed screen timer must not act');
 view=entry.view;paint(el,entry);epoch++;tick(1600);assert.equal(el.attrs['aria-hidden'],undefined,'A previous login timer must not act');
 entry={view,ctx:{epoch}};paint(el,entry);tick(1600);assert.equal(el.attrs['aria-hidden'],'true');
 const other=element();view={key:'other-product-colleague'};entry={view,ctx:{epoch}};paint(other,entry);assert.equal(other.attrs['aria-hidden'],undefined,'Different product/colleague must have its own presentation');
 other.isConnected=false;tick(1600);assert.equal(other.attrs['aria-hidden'],undefined,'Removed DOM cannot be collapsed by a stale timeout');
 for(let i=0;i<100;i++){view={key:'bounded-'+i};paint(element(),{view,ctx:{epoch}});}
 assert.ok(Object.keys(c.APP_READ_PRESENTATION).length<=80,'Bound memory over long sessions');
 console.log(file+': success timing, completeness, focus/details, refresh/error recovery, redraw, context/DOM guards and bounded state passed');
}
