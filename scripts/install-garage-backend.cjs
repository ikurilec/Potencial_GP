// Prepare the complete PRIVATE Golem file for its existing Apps Script deployment.
// No online writes; never publish the private output or its spreadsheet IDs.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const dir=path.resolve(process.argv[2]||path.join(root,'../../apps_script'));
const target=path.join(dir,'KOD_GOLEM.txt'),extension=path.join(root,'apps_script/KOD_GARAZ.txt');
let source=fs.readFileSync(target,'utf8');const marker='// SATORI_GARAGE_EXTENSION_START';
if(!fs.existsSync(path.join(dir,'KOD_GOLEM.before-garage.txt')))fs.writeFileSync(path.join(dir,'KOD_GOLEM.before-garage.txt'),source);
if(source.includes(marker))source=source.slice(0,source.indexOf(marker)).trimEnd();
// Re-running this installer replaces its routes instead of duplicating them.
source=source.split(/\r?\n/).filter(line=>!/^\s+if \(action === 'getGarage'\) return garageHandleAction_|^\s+if \(action === 'garageAction' \|\| action === 'garageRegisterPush'/.test(line)).join('\n');
function replaceOnce(before,after){if(!source.includes(after)){if(!source.includes(before))throw new Error('Golem source hook missing: '+before.slice(0,65));source=source.replace(before,after);}}
replaceOnce("    if (action === 'getStockData')", "    if (action === 'getGarage') return garageHandleAction_(ss, e, action);\n    if (action === 'garageAction' || action === 'garageRegisterPush') return jsonResponse({ok:false, error:'Táto operácia vyžaduje POST.'});\n    if (action === 'getStockData')");
replaceOnce("    if (action === 'logUsage') return usageHandleLog_(ss, e, 'gp');", "    if (action === 'garageAction' || action === 'garageRegisterPush') return garageHandleAction_(ss, e, action);\n    if (action === 'logUsage') return usageHandleLog_(ss, e, 'gp');");
source=source.replace(/action === 'garageAction' \|\| action === 'garageRegisterPush'(?! \|\| action === 'garageDrainPush')/g,"action === 'garageAction' || action === 'garageRegisterPush' || action === 'garageDrainPush'");
if(!source.includes('office account is restricted to Garage'))replaceOnce("      return { ok: true, username: username, user: authGetUser_(ss, username) };", `      var sessionUser=authGetUser_(ss, username);
      var sessionRole=String(sessionUser&&sessionUser.role||'').trim().toLowerCase().replace(/[_-]+/g,' ');
      if(/^(office|office user|fleet|fleet manager|parking manager|garaz|garáž)$/.test(sessionRole) && ['getGarage','garageAction','garageRegisterPush','logoutSession','changePassword'].indexOf(String(e.parameter.action||''))<0)return {ok:false,error:'Forbidden: office account is restricted to Garage'};
      return { ok: true, username: username, user: sessionUser };`);
source=source.replace("['getGarage','garageAction','garageRegisterPush','logoutSession','changePassword']","['getGarage','garageAction','garageRegisterPush','garageDrainPush','logoutSession','changePassword']");
// Same phone/user retains independent medical and Garage subscriptions.
// A token reused by a DIFFERENT account is reassigned, avoiding account leakage.
const start=source.indexOf('function pushUpsertToken_('),end=source.indexOf('function pushRemoveTokens_(',start);
if(start<0||end<0)throw new Error('Missing medical push helper');
source=source.slice(0,start)+`function pushUpsertToken_(ss, login, line, token) {
  var lock=LockService.getScriptLock();
  if(!lock.tryLock(3500))throw new Error('Odber upozornení sa práve mení. Skúste znova.');
  try {
    var sheet=pushTokenSheet_(ss), nowIso=new Date().toISOString(), owner=String(login).trim().toLowerCase();
    var data=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,4).getValues():[];
    for(var i=data.length-1;i>=0;i--)if(String(data[i][2])===token && String(data[i][0]).trim().toLowerCase()!==owner)sheet.deleteRow(i+2);
    data=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,4).getValues():[];
    for(var j=0;j<data.length;j++){
      if(String(data[j][2])===token && String(data[j][1])===String(line) && String(data[j][0]).trim().toLowerCase()===owner){sheet.getRange(j+2,1,1,4).setValues([[login,line,token,nowIso]]);SpreadsheetApp.flush();return;}
    }
    sheet.appendRow([login,line,token,nowIso]);SpreadsheetApp.flush();
  } finally {lock.releaseLock();}
}

`+source.slice(end);
// Sending happens outside the state lock. Never delete an unrelated token if
// the subscription table changed while FCM was replying.
replaceOnce('if (expired) deadRows.push(rows[i].rowIdx);','if (expired) deadRows.push({rowIdx:rows[i].rowIdx, token:String(rows[i].token)});');
replaceOnce('deadRows.sort(function(a, b) { return b - a; }).forEach(function(row) { sheet.deleteRow(row); });',`deadRows.sort(function(a, b) { return b.rowIdx - a.rowIdx; }).forEach(function(dead) {
      var cleanupLock=LockService.getScriptLock();if(!cleanupLock.tryLock(3500))return;
      try {if(dead.rowIdx>sheet.getLastRow())return;var current=sheet.getRange(dead.rowIdx,1,1,4).getValues()[0];if(current&&String(current[2])===dead.token)sheet.deleteRow(dead.rowIdx);}finally{cleanupLock.releaseLock();}
    });`);
fs.writeFileSync(target,source+'\n\n'+marker+'\n'+fs.readFileSync(extension,'utf8')+'\n// SATORI_GARAGE_EXTENSION_END\n');
fs.copyFileSync(extension,path.join(dir,'KOD_GARAZ.txt'));
console.log('Complete private Golem deployment file prepared. Existing URL stays unchanged.');
