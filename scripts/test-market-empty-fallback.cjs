const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const src=fs.readFileSync('app.js','utf8');const a=src.indexOf('function loadPharmaDataNetwork('),b=src.indexOf('// Hlavná odpoveď getPharmaData',a);
let calls=[],errors=[];
const c={Promise,IS_DEV:false,PHARMA_STATE:{cache:{},loading:{},activeCode:'A',oblast:'KE',kvartal:'2604'},PHARMA_GRAF_STATE:{cache:{A_KE:{}},loading:{}},
PL_PROD_SHEET_STATE:{open:false},pharmaGrafCacheKey:(c,o)=>c+'_'+o,pharmaDataRequestUrl:(c,o,q)=>q,
pharmaIsCurrentKvartal:q=>q==='2604',pharmaKvartalPrev:q=>String(Number(q)-1),
appFetchWithRetry:u=>{calls.push(u);return Promise.resolve({ok:true,summary:[],okresy:[]});},
document:{getElementById:()=>null},pharmaQuarterMonths:()=>['2610','2611','2612'],_phPersistSave:()=>{},pharmaRender:()=>{c.rendered=true;},pharmaGrafFromMain:()=>{},aflamilFamilyMaybeRefresh:()=>{},appShowErrorCard:(id,o)=>errors.push(o),
loadPharmaData:(code,o,q)=>c.loadPharmaDataNetwork(code,o,q)};
vm.createContext(c);vm.runInContext(src.slice(a,b),c);
(async()=>{await c.loadPharmaDataNetwork('A','KE','2604');assert.equal(calls.length,1,'Empty market data must not recursively fetch older quarters');assert.equal(errors.length,0,'Valid empty history is a successful check');assert.equal(c.rendered,true,'Empty history must finish with a visible state');assert.equal(c.PHARMA_STATE.cache.A_KE_2604.ok,true);assert.equal(Object.keys(c.PHARMA_STATE.loading).length,0);console.log('Empty quarter is cached, displayed and verified without recursive fetches');})().catch(e=>{console.error(e);process.exitCode=1;});
