const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8');
assert.ok(source.includes('function appReadResource('),'Resource-scoped freshness is required');
const start=source.indexOf('var APP_DATA_READ_ACTIONS'),end=source.indexOf('// ── Overovanie dát otvorenej sekcie');
const store=new Map();let user={username:'rep',role:'rep',line:'gp'},epoch=1,now=1000;
const c={URL,URLSearchParams,location:{href:'https://satori.test/'},getSession:()=>user,appLineTag:()=>user.line,
 appLineCapture:()=>({line:user.line,epoch}),appLineContextActive:ctx=>ctx.line===user.line&&ctx.epoch===epoch,
 localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},setTimeout:()=>1,clearTimeout:()=>{},Date,Intl,document:{},Object,Array};
vm.createContext(c);vm.runInContext(source.slice(start,end),c);
const a=c.appReadResource('https://server/exec?action=getLekarne&login=colleague&fresh=1&token=secret&_t=123');
const b=c.appReadResource('https://server/exec?action=getLekarne&_t=999&token=other&login=colleague');
assert.equal(a.key,b.key,'Cache-busting and tokens do not define data identity');
assert.ok(!a.key.includes('secret'));
assert.equal(c.appReadResource('https://server/exec?action=saveNastenka'),null,'Writes are not checks');
assert.equal(c.appReadResource('https://server/exec?action=login'),null);
assert.equal(c.appReadValid(a,{ok:true,rows:[]}),true,'A valid empty result is a successful check');
for(const data of [null,{ok:false,rows:[]},{ok:true},{error:'Forbidden'}])assert.equal(c.appReadValid(a,data),false);
c.appReadRemember(a,1000);assert.equal(c.appReadLast(a),1000);
c.appReadRemember(a,2000,true);assert.equal(c.appReadLast(a),1000,'Failure retains successful timestamp');
epoch++;c.appReadRemember(a,3000);assert.equal(c.appReadLast(a),1000,'Old line epoch cannot advance timestamp');epoch--;
c.appReadMetaPersist(a.owner);vm.runInContext('APP_READ_META={};APP_READ_META_LOADED={}',c);assert.equal(c.appReadLast(a),1000,'Metadata persists after reload');
user={...user,line:'reagila'};assert.equal(c.appReadLast(c.appReadResource('https://server/exec?action=getLekarne&login=colleague')),0);
user={...user,line:'gp',username:'other'};assert.equal(c.appReadLast(c.appReadResource('https://server/exec?action=getLekarne&login=colleague')),0);
user={username:'rep',role:'boss',line:'gp'};assert.notEqual(c.appReadResource('https://server/exec?action=getLekarne&login=colleague').key,a.key);
const q3=c.appReadResource('https://server/exec?action=getPlnenieAll&rok=2026&Q=3'),q4=c.appReadResource('https://server/exec?action=getPlnenieAll&rok=2026&Q=4');assert.notEqual(q3.key,q4.key);
assert.match(c.appReadTimeLabel(new Date(2026,9,10,9,42).getTime(),new Date(2026,9,10,10).getTime()),/dnes.*9:42/);
assert.match(c.appReadTimeLabel(new Date(2026,9,9,9,42).getTime(),new Date(2026,9,10,10).getTime()),/včera/);
console.log('Validated freshness, no secrets/writes, persistent scoped metadata and time labels passed');
