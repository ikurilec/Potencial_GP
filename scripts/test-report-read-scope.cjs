const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function take(s,name){const a=s.indexOf('function '+name+'('),b=s.indexOf('\nfunction ',a+1);assert.ok(a>=0,name);return s.slice(a,b);}
for(const file of ['app.js','nahlad/app.js']){
 const s=fs.readFileSync(file,'utf8');let user={username:'manager',line:'gp',role:'admin'},view;
 const c={URL,Date,JSON,Object,Array,Number,Math,Promise,location:{href:'https://satori.test/'},
  getSession:()=>user,appLineTag:()=>user.line,appLineCapture:()=>({line:user.line,epoch:1}),appLineContextActive:x=>x.line===user.line,
  localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>1,clearTimeout(){},document:{}};
 vm.createContext(c);vm.runInContext(s.slice(s.indexOf('var APP_DATA_READ_ACTIONS'),s.indexOf('// ── Overovanie dát otvorenej sekcie')),c);
 c.appReadView=()=>view;c.APP_READ_CHECKS={};c.APP_REQUEST_QUEUE={items:[],running:[]};
 view={type:'mgr-reporty',key:'report',actions:['getPlnenieAll','getPharmaData'],params:{rok:2026,Q:3},path:'https://server/exec',
  scopes:{getPharmaData:{produkt:['AFLtbl','AFLsach'],oblast:['KE'],kvartal:['2603']}}};
 const put=(query,failed=false)=>{const r=c.appReadResource('https://server/exec?action='+query);r.visible=true;c.appReadRemember(r,Date.now(),failed);return r;};
 put('getPlnenieAll&rok=2026&Q=3');
 put('getPharmaData&produkt=AFLsach&oblast=KE&kvartal=2603');
 const unrelated=put('getPharmaData&produkt=AFLcrm&oblast=MT&kvartal=2602',true);
 assert.equal(c.appRequestMatchesView(unrelated,view),false,file+': report must exclude another region/product/quarter');
 assert.equal(c.appReadSummary(view).error,false,'An unrelated failed market read cannot turn a valid report red');
 put('getPharmaData&produkt=AFLtbl&oblast=KE&kvartal=2603',true);
 assert.equal(c.appReadSummary(view).error,true,'A selected form failure must remain visible');
 put('getPharmaData&produkt=AFLtbl&oblast=KE&kvartal=2603');assert.equal(c.appReadSummary(view).error,false);
 assert.equal(c.appReadSummary(view).groups.length,3,'Only sales and the two selected forms appear');
 assert.equal(c.appRequestMatchesView(c.appReadResource('https://server/exec?action=getPharmaData'),view),false,'Unspecified market scopes cannot match a specific report');
 // Inspect the actual report view construction, rather than only a hand-built scope.
 const shown=new Set();c.document={body:{classList:{contains:x=>x==='manager-mode'}},getElementById:id=>({classList:{contains:x=>x==='show'&&shown.has(id)}})};
 Object.assign(c,{PL_STATE:{q:3,year:2026},GYN_APP:{q:3,year:2026},MGR_STATE:{subtab:'reporty'},SCRIPT_URL:'https://server/exec',REAGILA_SCRIPT_URL:'https://server/exec',GYN_SCRIPT_URL:'https://server/exec',_panelCurrent:null,
  RPT_VIEW:{scope:'rep',username:'colleague'},rptViewPeriod:()=>({q:3,year:2026}),
  rptViewPharmaReadScope:()=>({produkt:['AFLtbl','AFLsach'],oblast:['KE'],kvartal:['2603']})});
 vm.runInContext(take(s,'appReadView'),c);
 const actual=c.appReadView();assert.deepEqual(JSON.parse(JSON.stringify(actual.scopes.getPharmaData)),view.scopes.getPharmaData);
 assert.equal(actual.actions.includes('getPharmaOverview'),true,'Individual GP reports track the overview used by their benchmark');
 const key=actual.key;c.rptViewPharmaReadScope=()=>({produkt:['AFLtbl','AFLsach','SUP'],oblast:['KE'],kvartal:['2603']});
 assert.equal(c.appReadView().key,key,'Adding market products cannot invalidate the refresh currently in progress');
 c.RPT_VIEW.username='another';assert.notEqual(c.appReadView().key,key,'Changing the representative must change the read scope');
 c.RPT_VIEW.scope='sk';assert.equal(c.appReadView().actions.some(a=>/^getPharma/.test(a)),false,'Group reports cannot show/retry individual market history');
 user={...user,line:'reagila'};c.RPT_VIEW.scope='rep';assert.equal(c.appReadView().actions.includes('getPharmaOverview'),false,'Reagila does not call the GP benchmark endpoint');
 user={...user,line:'gyn'};c.RPT_VIEW.scope='rep';assert.equal(c.appReadView().actions.some(a=>/^getPharma/.test(a)),false,'Gyn reports use pharmacy opportunities, not GP market calls');
 console.log(file+': actual report selection, no historical/other-region failures and stable in-progress view passed');
}
