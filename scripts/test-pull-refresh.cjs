const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),cp=require('child_process');
const baseline=process.argv.includes('--baseline');
const src=baseline?cp.execFileSync('git',['show','HEAD:app.js'],{encoding:'utf8',maxBuffer:8e6}):fs.readFileSync('app.js','utf8');
const start=baseline?src.indexOf('function appAttachOverlayPtr('):src.indexOf('var APP_PTR_OWNER=');
const code=src.slice(start,src.indexOf('// ── Ktoré panely obnovu majú',start));
const listeners={},classes=new Set(['show']),arc={style:{}},indicator={style:{},classList:{add(){},remove(){},toggle(){}},querySelector:()=>arc};
let now=0,epoch=1,viewKey='gp|rep|role|stocks|{}',refreshes=0,finish;
const root={scrollTop:0,parentElement:null,contains:()=>true,classList:{contains:x=>classes.has(x),add:x=>classes.add(x),remove:x=>classes.delete(x)}};
const target={nodeType:1,parentElement:root,scrollTop:0,closest:()=>null};
const c={Promise,Date:{now:()=>now},APP_PTR_THRESHOLD:110,APP_PTR_CIRC:97.4,
 getSession:()=>({username:'rep'}),getComputedStyle:()=>({overflowY:'auto'}),
 appReadView:()=>({key:viewKey,host:'#body',actions:['getStockData']}),appReadOwner:()=> 'rep',appLineCapture:()=>({epoch}),appLineContextActive:x=>x.epoch===epoch,
 document:{body:{classList:{contains:()=>false}},querySelector:()=>root,getElementById:()=>null,addEventListener:(type,fn,opt)=>(listeners[type]||(listeners[type]=[])).push({fn,opt})},
 appPtrEnsure:()=>indicator,appStartManualRefresh:()=>{},haptic:()=>{},setTimeout:()=>1,clearTimeout:()=>{}};
vm.createContext(c);vm.runInContext(code,c);c.appPtrRefreshCurrent=()=>false;
c.appAttachOverlayPtr({getRoot:()=>root,isActive:()=>true,scrollTop:()=>root.scrollTop,onRefresh:done=>{refreshes++;finish=done;}});
c.appAttachOverlayPtr({getRoot:()=>root,isActive:()=>true,scrollTop:()=>root.scrollTop,onRefresh:done=>{refreshes++;finish=done;}});
const event=(type,x,y,count=1)=>{let prevented=false;const e={target,touches:Array.from({length:count},()=>({clientX:x,clientY:y})),cancelable:true,preventDefault(){prevented=true;}};(listeners[type]||[]).forEach(l=>l.fn(e));return prevented;};
assert.ok(listeners.touchmove.some(l=>l.opt.passive===false),'Android must reserve the gesture with a non-passive touchmove listener');
assert.ok(listeners.touchcancel?.length,'Cancelled gestures must reset');
event('touchstart',100,100);assert.equal(event('touchmove',100,103),true,'Reserve even the first small downward move');event('touchmove',100,220);event('touchend',100,220);assert.equal(refreshes,1);
event('touchstart',100,100);event('touchmove',100,240);event('touchend',100,240);assert.equal(refreshes,1,'An in-flight refresh must not start twice');now+=1000;finish();
event('touchstart',100,100);event('touchmove',100,220);event('touchcancel',100,220);event('touchend',100,220);assert.equal(refreshes,1,'touchcancel never refreshes');
event('touchstart',100,100);event('touchmove',160,104);event('touchmove',160,260);event('touchend',160,260);assert.equal(refreshes,1,'Horizontal swipe must never turn into refresh');
root.scrollTop=50;event('touchstart',100,100);root.scrollTop=0;event('touchmove',100,240);event('touchend',100,240);assert.equal(refreshes,1,'Scrolling to the top mid-gesture is not a new pull');
event('touchstart',100,100);event('touchmove',100,240,2);event('touchend',100,240);assert.equal(refreshes,1,'Pinch/multitouch does not refresh');
event('touchstart',100,100);epoch++;event('touchmove',100,240);event('touchend',100,240);assert.equal(refreshes,1,'Line change cancels the gesture');
event('touchstart',100,100);viewKey+='new';event('touchmove',100,240);event('touchend',100,240);assert.equal(refreshes,1,'Navigation cancels the gesture');
event('touchstart',100,100);event('touchmove',100,160);event('touchend',100,160);assert.equal(refreshes,1,'A short pull snaps back');
console.log('First-motion cancellation, threshold, busy guard, touchcancel, horizontal, nested scroll, multitouch and navigation guards passed');
