const fs = require('fs');
const assert = require('assert');

const index = fs.readFileSync('index.html', 'utf8');
const gp = fs.readFileSync('apps_script/kód.gs', 'utf8');
const gyn = fs.readFileSync('apps_script/kód_gyn.gs', 'utf8');

assert(index.includes('function authDeviceId()'), 'frontend must persist a per-device id');
assert(index.includes('authSessionParams('), 'frontend URL helpers must append session auth params');
assert(index.includes('device_id=') && index.includes('authDeviceId()'), 'login must send device_id');
assert(index.includes('session_token') && index.includes('session_expires_at'), 'login response must be stored in session');

for (const [name, src] of [['GP Apps Script', gp], ['Gyn Apps Script', gyn]]) {
  assert(src.includes('function authCreateSession_'), `${name} must create sessions on login`);
  assert(src.includes('function authRequireSession_'), `${name} must validate sessions on protected endpoints`);
  assert(src.includes('function authGetSessionsSheet_'), `${name} must auto-create Sessions sheet`);
  assert(src.includes('session_token'), `${name} login response must include session_token`);
  assert(src.includes('session_expires_at'), `${name} login response must include session_expires_at`);
}

console.log('session_security_test ok');
