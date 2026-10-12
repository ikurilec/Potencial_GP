// Exercise the actual login, session authentication and stock route together.
// Sheets and Google services are local fixtures; no production requests/writes.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const dirs=[process.env.SATORI_APPS_SCRIPT_DIR,process.env.SATORI_BACKEND_DIR,path.resolve(__dirname,'../apps_script'),path.resolve(__dirname,'../../../apps_script')].filter(Boolean);

function sheet(initial=[]){
 const rows=initial.map(row=>row.slice());
 return {rows,getLastRow:()=>rows.length,
  getDataRange:()=>({getValues:()=>rows.map(row=>row.slice())}),
  getRange:(r,c,n=1,m=1)=>({
   getValues:()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>rows[r-1+i]?.[c-1+j]??'')),
   setValues:values=>values.forEach((row,i)=>row.forEach((v,j)=>{(rows[r-1+i]??=[])[c-1+j]=v;}))
  }),appendRow:row=>rows.push(row.slice()),deleteRow:r=>rows.splice(r-1,1),setFrozenRows:()=>{}};
}
function book(tabs){return {getSheetByName:n=>tabs[n]||null,insertSheet:n=>tabs[n]=sheet()};}
const headers=['as_of','line','product_key','product','availability','sukl','packaging','distributor_units','coverage_days','weekly_avg_sales','po_ordered','po_confirmed','free_stock','under_quality_control','emergency_stock'];
function stockRow(line,date,days){return [date,line,line+'-product',line+' Product','available','12345','30 tablets',100,days,10,20,15,777,888,999];}
const configs=[
 {file:'REAGILA',line:'reagila',sessionLine:'gp',roles:['kam','admin','boss','bum','pm','am','am west','am east']},
 {file:'GOLEM',line:'gp',sessionLine:'gp',roles:['rep west','rep east','admin','boss','bum','pm','am','am west','am east']},
 {file:'GYN',line:'gyn',sessionLine:'gyn',roles:['gyn-rep','gyn-am','gyn-manager','admin','boss','bum','pm']}
];
const contexts=[];
for(const config of configs){
 const file=dirs.map(d=>path.join(d,'KOD_'+config.file+'.txt')).find(f=>fs.existsSync(f));assert.ok(file,'Private local backend source missing: '+config.file);
 const users=sheet([['login','heslo','meno','rola','region','gyn_region']]);
 const sessions=sheet();const stocks=sheet([headers,...['gp','reagila','gyn'].flatMap(line=>[stockRow(line,'2026-09-28',5),stockRow(line,'2026-10-12',30)])]);
 const own=book({Pouzivatelia:users,Sessions:sessions,...(config.line==='gp'?{Sklady:stocks}:{})});
 const shared=book({Sklady:stocks});let stockOpens=0,uuid=0;
 const memory=new Map(),ctx={Date,JSON,Math,Number,String,Object,Array,Error,
  PropertiesService:{getScriptProperties:()=>({getProperty:()=>null})},
  CacheService:{getScriptCache:()=>({get:k=>memory.get(k)||null,put:(k,v)=>memory.set(k,v)})},
  LockService:{getScriptLock:()=>({waitLock:()=>{},releaseLock:()=>{}})},
  Utilities:{getUuid:()=>config.line+'-test-'+(++uuid)},Logger:{log:()=>{}},
  ContentService:{MimeType:{JSON:'application/json',TEXT:'text/plain'},createTextOutput:text=>({text,setMimeType(){return this;}})},
  SpreadsheetApp:{getActive:()=>own,openById:id=>{if(id===ctx.SHEET_ID)return own;if(id===ctx.STOCK_SOURCE_SHEET_ID){stockOpens++;return shared;}throw Error('Unexpected sheet');}}
 };
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:path.basename(file)});
 function call(parameters){const out=ctx.doGet({parameter:parameters});try{return JSON.parse(out.text);}catch(e){throw Error(config.file+' returned non-JSON: '+out.text);}}
 const fixture={config,ctx,own,users,sessions,stocks,memory,call};contexts.push(fixture);
 for(const role of config.roles){
  const username='stock-test-'+role.replace(/\s/g,'-');users.appendRow([username,'synthetic-password','Test User',role,'KE','KE']);
  const login=call({action:'login',username,password:'synthetic-password',device_id:'test-device',remember:'1'});
  assert.equal(login.ok,true,config.file+' login: '+role);
  assert.equal(sessions.rows.at(-1)[3],config.sessionLine,'Stock auth must match the namespace actually written by login');
  const req={action:'getStockData',token:ctx.API_TOKEN,username,device_id:login.device_id,session_token:login.session_token,fresh:'1'};
  const data=call(req);
  assert.equal(data.ok,true,config.file+' '+role+': valid login must load stocks, got '+data.error);
  assert.equal(data.as_of,'2026-10-12');assert.equal(data.rows.length,1);
  assert.equal(data.rows[0].line,config.line,'Session namespace must not select another product line');
  assert.equal(data.rows[0].coverage_days,30);assert.equal(data.rows[0].po_confirmed,15);
  for(const field of ['free_stock','under_quality_control','emergency_stock'])assert.equal(data.rows[0][field],undefined,'Private stock columns stay private');
  assert.equal(call({...req,fresh:'0'}).ok,true,'Warm server cache accepts a valid session');
  const before=stockOpens;
  for(const invalid of [{token:'wrong'},{session_token:'wrong'},{device_id:'wrong'},{username:''}]){
   const denied=call({...req,fresh:'0',...invalid});assert.equal(denied.ok,false,'Authentication must precede even a warm cache');
  }
  assert.equal(stockOpens,before,'Denied requests must not access the shared stock source');
  const session=sessions.rows.at(-1);session[5]=new Date(Date.now()-1000);
  assert.equal(call({...req,fresh:'0'}).error,'Session expired');session[5]=new Date(Date.now()+3600000);
  const realNamespace=session[3];session[3]=config.sessionLine==='gp'?'reagila':'gp';
  assert.equal(call({...req,fresh:'0'}).ok,false,'Do not weaken namespace validation');session[3]=realNamespace;
  const freshRow=stocks.rows.find(row=>row[1]===config.line&&row[0]==='2026-10-12');freshRow[8]=42;
  assert.equal(call({...req,fresh:'0'}).rows[0].coverage_days,30,'Warm read reuses its own line cache');
  assert.equal(call(req).rows[0].coverage_days,42,'Explicit refresh checks the newest sheet values');freshRow[8]=30;
  assert.equal(call({...req,action:'logoutSession'}).ok,true);
  assert.equal(call({...req,fresh:'0'}).ok,false,'Logged-out tokens cannot read cached stock data');
 }
 console.log(config.file+': login → stocks → refresh → logout passed for '+config.roles.length+' roles');
}
// Both backends historically label sessions "gp", but store them in separate
// spreadsheets. An authentic Golem session still cannot read Reagila stocks.
const [reagila,golem]=contexts;const loginName='cross-line-test';
for(const x of [reagila,golem])x.users.appendRow([loginName,'synthetic-password','Test User','admin','KE']);
const gpLogin=golem.call({action:'login',username:loginName,password:'synthetic-password',device_id:'same-device'});
assert.equal(reagila.call({action:'getStockData',username:loginName,device_id:gpLogin.device_id,session_token:gpLogin.session_token,token:reagila.ctx.API_TOKEN}).ok,false,'Golem sessions cannot authenticate against the Reagila spreadsheet');
console.log('Cross-line session rejection and stock column/line isolation passed');
