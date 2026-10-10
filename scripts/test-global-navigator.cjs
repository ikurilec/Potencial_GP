const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('app.js','utf8');
let user={username:'rep',role:'rep west',line:'gp'},calls=[];
const c={console,URL,Promise,setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},
 document:{querySelectorAll:()=>[],addEventListener(){},getElementById:()=>null,body:{classList:{contains:()=>false,toggle(){}}}},
 getSession:()=>user,lkNorm:s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),appEsc:s=>String(s),
 mgrDetectRole:s=>['admin','boss','bum','am','am west','am east'].includes(s.role)?s.role:null,
 viacDlazdice:()=>[{t:'Sklady',ic:'📦',fn:'openSklady()'},{t:'Rebríček',ic:'🏆',fn:'openLeaderboard()'}],
 appGoDomov:()=>calls.push('home'),appGoPlnenie:()=>calls.push('sales'),appGoNastenka:id=>calls.push(['board',id]),
 openSklady:()=>calls.push('stock'),openLeaderboard:()=>calls.push('ranking'),
 LK_STATE:{cache:{rep:{rows:[{lekaren:'U Leva',okres:'Senec',mesto:'Senec',login:'rep'}]},other:{rows:[{lekaren:'Cudzia',login:'other'}]}},_rows:[]},
 lkBuildLekarne:rows=>rows.map(r=>({...r,key:[r.okres,r.mesto,r.lekaren].join('|||')})),
 LK_MGR_ALL:[],MGR_STATE:{reps:{rep:{visits:[]}}},MGR_REP_NAMES:{rep:'Meno Repa'},
 GYN_LK:{cache:{rep:[{lekaren:'Gyn lekáreň',okres:'Senec',mesto:'Senec',login:'rep'}]},login:'rep',rows:[]},
 NST:{posts:[{id:'p1',text:'Nová správa',meno:'Autor',comments:[{text:'Čerstvý komentár'}]}]},
 GYN_STATE:{repList:[]},GYN_LB:{repList:[]},TEAM_PL_STATE:{payload:{reps:[]}},
 LK_PROD_DISPLAY:{lonelix_tb:'Lonelix tbl.',lonelix_sr:'Lonelix sirup'},LK_REAGILA_PRODS:[],
 localStorage:{getItem:()=>null,setItem(){}},window:{},appLineCapture:()=>({line:user.line}),appLineContextActive:ctx=>ctx.line===user.line};
c.window=c;vm.createContext(c);
vm.runInContext(src.slice(src.indexOf('var GS = '),src.indexOf('/* ═══ LAUNCHER')),c);
let sections=c.gsSections();
for(const title of ['Domov','Plnenie','Kalendár','Nástenka','Menu','Sklady','Rebríček'])assert.ok(sections.some(e=>e.title===title),'Missing current route: '+title);
sections.find(e=>e.title==='Domov').run();assert.equal(calls.pop(),'home');
assert.equal(c.gsPharmacies().some(e=>e.title==='U Leva'),true,'Own cached pharmacies available before opening list');
assert.equal(c.gsPharmacies().some(e=>e.title==='Cudzia'),false,'Rep cannot search other pharmacy cache');
user={username:'manager',role:'am west',line:'gp'};
c.plnenieGetActiveReps=()=>['rep'];c.MGR_STATE.reps.other={visits:[{lekar:'Neprístupný lekár'}]};
c.gsData().history.rep=[{lekar:'Dostupný lekár'}];
assert.equal(c.gsDoctors().some(e=>e.title==='Dostupný lekár'),true);
assert.equal(c.gsDoctors().some(e=>e.title==='Neprístupný lekár'),false,'Stale or unrelated manager histories never expand authorization');
assert.equal(c.gsPharmacies().some(e=>e.title==='Cudzia'),false,'Area manager cannot search outside assigned roster');
user={username:'rep',role:'gyn-rep',line:'gyn'};
assert.equal(c.gsPharmacies().some(e=>e.title==='Gyn lekáreň'),true,'Gyn uses its own pharmacy source');
assert.equal(c.gsPharmacies().some(e=>e.title==='U Leva'),false,'Never mix line pharmacy sources');
user={username:'manager',role:'gyn-am',line:'gyn'};assert.equal(c.gsIsMgr(),true,'Gyn manager detected');
user={username:'rep',role:'rep west',line:'gp'};
assert.ok(c.gsPosts().some(e=>c.gsNorm(e.kw).includes('cerstvy komentar')),'Search comments as well as posts');
c.gsPosts()[0].run();assert.deepEqual(calls.pop(),['board','p1']);
console.log('Global navigator routes, line isolation, own pharmacy cache, Gyn role and board search passed');
