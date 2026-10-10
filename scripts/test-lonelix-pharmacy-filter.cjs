const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8');
function fn(name){const start=source.indexOf('function '+name+'(');assert.ok(start>=0);const end=source.indexOf('\nfunction ',start+1);return source.slice(start,end<0?undefined:end).split('\n// ──')[0];}
const c={LK_STATE:{_rows:[]},LK_MGR_ALL:[],LK_PROD_DISPLAY:{},LK_REAGILA_PRODS:['reagila'],lkIsReagila:()=>false};
vm.createContext(c);
vm.runInContext(source.slice(source.indexOf('var LK_PROD_DISPLAY ='),source.indexOf('// Reagila portfólio pre Lekárne')),c);
for(const name of ['lkFilterDefault','lkFilterDataset','lkBuysAll','lkFilterProducts','lkProdQtyMatch','lkFilterMatch'])vm.runInContext(fn(name),c);
const pharmacy=(name,prods)=>({key:name,lekaren:name,allProds:Object.fromEntries(Object.entries(prods).map(([k,v])=>[k,{last3:v,prev3:0}])),months:[{rok:2026,mesiac:9,prods}],buys:[],creamReportPeriod:{rok:2026,mesiac:9}});
const data=[pharmacy('Tablets',{lonelix:9,lonelix_tb:9}),pharmacy('Syrup',{lonelix:3,lonelix_sr:3}),pharmacy('Both',{lonelix:7,lonelix_tb:6,lonelix_sr:1}),pharmacy('Zero',{lonelix_tb:0,lonelix_sr:0})];
for(const ctx of ['rep','mgr']){
 c.LK_STATE._rows=data;c.LK_MGR_ALL=data;c.LK_FILTER=c.lkFilterDefault();c.LK_FILTER._ctx=ctx;
 const products=Array.from(c.lkFilterProducts());
 assert.ok(products.includes('lonelix_tb')&&products.includes('lonelix_sr'),'Both forms must appear in product filter');
 assert.equal(c.LK_PROD_DISPLAY.lonelix_tb,'Lonelix tablety');assert.equal(c.LK_PROD_DISPLAY.lonelix_sr,'Lonelix sirup');
 const names=()=>data.filter(p=>c.lkFilterMatch(p)).map(p=>p.lekaren);
 c.LK_FILTER.buys=['lonelix_tb'];assert.deepEqual(names(),['Tablets','Both']);
 c.LK_FILTER.buys=['lonelix_sr'];assert.deepEqual(names(),['Syrup','Both']);
 c.LK_FILTER.buys=['lonelix_sr','lonelix_tb'];assert.deepEqual(names(),['Both']);
 c.LK_FILTER.buysOr=true;assert.deepEqual(names(),['Tablets','Syrup','Both']);
 c.LK_FILTER.buys=['lonelix_tb'];c.LK_FILTER.notBuys=['lonelix_sr'];assert.deepEqual(names(),['Tablets']);
 assert.equal(c.lkProdQtyMatch(data[0],'lonelix_tb',3,'avg3'),true);
 assert.equal(c.lkProdQtyMatch(data[1],'lonelix_tb',1,'avg3'),false);
 c.LK_STATE._rows=[];c.LK_MGR_ALL=[];
 assert.ok(c.lkFilterProducts().includes('lonelix_tb'),'Forms remain discoverable before fresh import arrives');
 console.log(ctx+': named forms, independent buy/not-buy filters, AND/OR and quantity thresholds passed');
}
