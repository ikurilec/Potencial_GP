const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
for(const file of ['app.js','nahlad/app.js']){
 const s=fs.readFileSync(file,'utf8'),timers=[];
 const nodes=Object.fromEntries(['dnes-overlay','sklady-overlay','rep-plnenie-overlay'].map(id=>{const classes=new Set();return [id,{id,style:{},classList:{add:(...c)=>c.forEach(x=>classes.add(x)),remove:(...c)=>c.forEach(x=>classes.delete(x)),contains:c=>classes.has(c)}}];}));
 const c={document:{getElementById:id=>nodes[id],body:{style:{},classList:{contains:()=>false}}},_panelCurrent:null,_panelStack:[],_PANEL_ORDER:{},_routerSyncHash(){},repNavSetActive(){},repTabSetActive(){},setTimeout:fn=>timers.push(fn)};
 vm.createContext(c);vm.runInContext(s.slice(s.indexOf('function _panelShow('),s.indexOf('function closeAllPanels(')),c);
 c._panelShow('dnes-overlay');c._panelShow('sklady-overlay');c._panelShow('dnes-overlay',true);timers.splice(0).forEach(fn=>fn());
 assert.equal(c._panelCurrent,'dnes-overlay');assert.equal(nodes['dnes-overlay'].classList.contains('show'),true,'An earlier animation cannot hide the reopened Home');assert.equal(nodes['sklady-overlay'].classList.contains('show'),false);
 c._panelShow('sklady-overlay');c._panelShow('rep-plnenie-overlay');c._panelShow('dnes-overlay',true);timers.splice(0).forEach(fn=>fn());
 assert.equal(nodes['dnes-overlay'].classList.contains('show'),true);assert.equal(nodes['sklady-overlay'].classList.contains('show'),false);assert.equal(nodes['rep-plnenie-overlay'].classList.contains('show'),false);
 console.log(file+': fast Home return survives stale animation callbacks and intermediate panels close');
}
