const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const src=fs.readFileSync('app.js','utf8');const a=src.indexOf('function loadPharmaDataNetwork('),b=src.indexOf('// Hlavná odpoveď getPharmaData',a);
let calls=[],errors=[];
const c={Promise,IS_DEV:false,PHARMA_STATE:{cache:{},loading:{},activeCode:'A',oblast:'KE',kvartal:'2604'},PHARMA_GRAF_STATE:{cache:{A_KE:{}},loading:{}},
PL_PROD_SHEET_STATE:{open:false},pharmaGrafCacheKey:(c,o)=>c+'_'+o,pharmaDataRequestUrl:(c,o,q)=>q,
pharmaIsCurrentKvartal:q=>q==='2604',pharmaKvartalPrev:q=>String(Number(q)-1),
appFetchWithRetry:u=>{calls.push(u);return Promise.resolve({ok:true,summary:[],okresy:[]});},
document:{getElementById:()=>null},pharmaGrafFromMain:()=>{},aflamilFamilyMaybeRefresh:()=>{},appShowErrorCard:(id,o)=>errors.push(o),
loadPharmaData:(code,o,q)=>c.loadPharmaDataNetwork(code,o,q)};
vm.createContext(c);vm.runInContext(src.slice(a,b),c);
(async()=>{c.loadPharmaDataNetwork('A','KE','2604');for(let i=0;i<30;i++)await Promise.resolve();assert.ok(calls.length<=2,'Empty market data recursively fetch ever older quarters');assert.equal(errors.length,1,'Empty history must finish with a visible state');assert.equal(Object.keys(c.PHARMA_STATE.loading).length,0);console.log('Empty quarter fallback is bounded and exits loading');})().catch(e=>{console.error(e);process.exitCode=1;});
