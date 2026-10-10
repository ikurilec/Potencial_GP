const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
for(const line of ['GOLEM','REAGILA']){
 const dirs=[process.env.SATORI_APPS_SCRIPT_DIR,path.resolve(__dirname,'../apps_script'),path.resolve(__dirname,'../../../apps_script')].filter(Boolean);
 const file=dirs.map(dir=>path.join(dir,'KOD_'+line+'.txt')).find(file=>fs.existsSync(file));
 assert.ok(file,'Set SATORI_APPS_SCRIPT_DIR to the local Apps Script source folder');
 const s=fs.readFileSync(file,'utf8');
 function fn(name){const start=s.indexOf('function '+name+'(');assert.ok(start>=0);const end=s.indexOf('\nfunction ',start+1);return s.slice(start,end<0?undefined:end).split('\n// ──')[0];}
 let durable=0,short=0,read=0;
 const rows=[{login:'rep',rok:2026,mesiac:9,okres:'TN',mesto:'TN',lekaren:'A',prods:{lonelix:5},ck:'key'}];
 const sheet={};const ss={getSheetByName:()=>sheet};
 const c={FORCE_FRESH_READ_:true,DATA_CACHE_TTL_SEC:7200,SC_DEFAULT_TTL_MS:86400000,lkMark_:()=>{},lkBaseKey_:()=> 'base',lkDetailKey_:()=> 'detail',
  bigGetText_:()=>null,bigPutText_:()=>durable++,cachePutText_:()=>short++,lkBuildBaseRows_:()=>{read++;return rows;},lkReadKremContacts_:()=>({}),lkBuildDetailRows_:()=>{read++;return [{produkt:'lonelix',variant:'tbl 1000mg 3×10',mesiace:'202609:5'}];}};
 const hasDetail=s.includes('function lkReadDetailRows_(');
 vm.createContext(c);vm.runInContext(fn('lkReadRows_')+(hasDetail?fn('lkReadDetailRows_'):''),c);
 if(s.includes('function lkCacheReadRows_('))vm.runInContext(fn('lkCacheReadRows_'),c);
 assert.equal(c.lkReadRows_(ss,'rep','')[0].mesiac,9);
 if(hasDetail)assert.equal(c.lkReadDetailRows_(ss,'rep')[0].mesiace,'202609:5');
 assert.equal(read,hasDetail?2:1,'Fresh reads must read source sheets');
 assert.equal(durable,0,'Fresh pharmacy reads must not wait on durable-cache locks/writes');
 assert.equal(short,hasDetail?2:1,'Fresh results may update short cache');
 c.FORCE_FRESH_READ_=false;
 c.lkReadRows_(ss,'rep','');if(hasDetail)c.lkReadDetailRows_(ss,'rep');
 assert.equal(durable,hasDetail?2:1,'Normal/warm reads still populate durable cache');
 console.log(line+': direct sheet reads and no persistent-cache writes during fresh refresh');
}
