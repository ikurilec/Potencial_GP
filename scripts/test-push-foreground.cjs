const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');const src=fs.readFileSync('app.js','utf8');
const code=src.slice(src.indexOf('function pushHandleForeground('),src.indexOf('function pushShowForegroundBanner('));
for(const line of ['gp','gyn','reagila'])for(const role of ['rep west','rep east','am west','am east','admin','boss','bum','pm','asistent','gyn-rep','gyn-am','gyn-pm','gyn-bum','gyn-asistent','kam']){
 let calls=[],user={username:'test',role,line};const c={getSession:()=>user,appLineTag:()=>line,nstFetch:()=>calls.push('board'),gynCalSync:()=>calls.push('calendar'),appStartManualRefresh:()=>{},appPtrRefreshCurrent:()=>calls.push('data'),pushShowForegroundBanner:(t,b)=>calls.push(['banner',t,b])};
 vm.createContext(c);vm.runInContext(code,c);
 for(const kind of ['board_post','board_comment','board_mention','absence_request','absence_decision','team_absence_changed','calendar_added','calendar_changed','calendar_deleted','sales_data','market_share_data']){calls=[];c.pushHandleForeground({data:{kind,line,title:'Test',body:'Body'}});assert.equal(calls[0],kind.startsWith('board')?'board':kind.includes('absence')||kind.startsWith('calendar')?'calendar':'data');assert.equal(calls.filter(x=>Array.isArray(x)).length,1);}
 calls=[];c.pushHandleForeground({data:{kind:'board_post',line:line==='gp'?'gyn':'gp',title:'Test'}});assert.equal(calls.length,1,'Another line must not refresh the current account data');
 user=null;calls=[];c.pushHandleForeground({data:{kind:'board_post',title:'Private'}});assert.equal(calls.length,0,'Logged-out session does not show private popups');
}
console.log('45 line/role foreground combinations: board, comments, approvals, team absences, data updates, line isolation and logout passed');
