const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

async function check(prefix) {
  const root = path.resolve(__dirname, '..', prefix);
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const extract = (start, end) => app.slice(app.indexOf(start), app.indexOf(end, app.indexOf(start)));
  const elements = {};
  for (const id of ['login-user', 'login-pass', 'login-err', 'login-btn', 'login-remember', 'login-screen', 'line-chooser-screen', 'line-remember-cb']) {
    elements[id] = {value: '', checked: false, innerHTML: '', classList: {add() {}, remove() {}, contains() {return true;}}};
  }
  elements['login-user'].value = 'member';
  elements['login-pass'].value = 'fixture';
  let dual = null, gynCount = 0;
  const probes = [];
  const c = {
    console, Promise, Object, String, Date, clearTimeout,
    setTimeout: callback => setTimeout(callback, 0),
    IS_DEV: true, LOGIN_REMEMBER_ME: true,
    SCRIPT_URL: 'gp', GYN_SCRIPT_URL: 'gyn', REAGILA_SCRIPT_URL: 'reagila', LINE_PREF_NONE: '__none__',
    localStorage: {getItem() {return null;}, setItem() {}},
    document: {getElementById: id => elements[id] || null},
    authDeviceId: () => 'fixture', lineGetPref: () => '', lineSetPref() {},
    loginRememberCredentials() {}, loginScreenSetExclusive() {}, mgrCaptureLineDiag() {},
    mgrStoreDualIfEligible(username, gp, gyn, reagila) {
      dual = {username};
      for (const [line, data] of Object.entries({gp, gyn, reagila})) if (data.ok) dual[line] = data;
    },
    mgrGetDual: () => dual, mgrSetDual: data => {dual = data;},
    mgrBuildGpUser: (username, data) => ({...data, username}),
    mgrBuildGynUser: (username, data) => ({...data, username, line: 'gyn'}),
    mgrBuildReagilaUser: (username, data) => ({...data, username, line: 'reagila'}),
    mgrRenderLineSwitch() {}, haptic() {}, getSession: () => null,
    loginSuccess() {throw new Error('The chooser must remain open.');},
    gynLoginSuccess() {throw new Error('The chooser must remain open.');},
    SatoriGarageBridge: {
      reset() {},
      officeOnly: () => false,
      canAccessSession: session => session.garage_access === true,
      async checkLoginAccess(username, line) {probes.push(line); return line === 'gyn';}
    },
    async appLoginFetch(line) {
      if (line === 'gyn' && ++gynCount === 1) return {ok: false, error: 'Cold start'};
      return {ok: true, role: 'rep', session_token: 'fixture-' + line};
    },
    _lineRetryInFlight: {}
  };
  c.window = c;
  vm.createContext(c);
  vm.runInContext(extract('function lineMergeLoginSuccess(', 'function mgrStoreDualIfEligible('), c);
  vm.runInContext(extract('function lineChooserEsc(', '// ── Zapamätanie prihlásenia'), c);
  vm.runInContext(extract('var _loginAttemptId=0;', 'function toggleLoginEye()'), c);
  c.doLogin();
  await new Promise(resolve => setTimeout(resolve, 100));
  assert.equal(gynCount, 2, prefix + ' Gyn must succeed on the silent retry.');
  assert.ok(c._lineChooserCtx.lines.includes('gyn'), prefix + ' Retry must unlock the medical line.');
  assert.ok(probes.includes('gyn'), prefix + ' Retry must discover Garage membership on the new source.');
  assert.ok(c._lineChooserCtx.lines.includes('garage'), prefix + ' Eligible retry member must see Garage.');
  assert.equal(dual.gyn.garage_access, true, prefix + ' Membership must reach the real dual session.');
  console.log((prefix || 'live') + ': regular member on silent login retry passed');
}

async function checkTargets(prefix) {
  const root = path.resolve(__dirname, '..', prefix);
  const current = {username: 'member', role: 'rep', session_token: 'gp-token'};
  const dual = {username: 'member', gp: current, gyn: {username: 'member', role: 'rep', session_token: 'gyn-token', line: 'gyn', garage_access: true}};
  const c = {Date, Set, URL, AbortController, setTimeout, clearTimeout, location:{href:'https://satori.test/'}, SCRIPT_URL:'https://satori.test/api',API_TOKEN:'fixture',authDeviceId:()=> 'fixture',fetch:async()=>({ok:true,json:async()=>({ok:true,me:{id:'member'}})}),getSession: () => current, mgrGetDual: () => dual};
  c.window = c;
  vm.createContext(c);
  vm.runInContext(fs.readFileSync(path.join(root, 'garage-integration.js'), 'utf8'), c);
  await c.SatoriGarageBridge.checkLoginAccess('member','gyn',Object.assign(dual.gyn,{ok:true}));
  assert.equal(c.SatoriGarageBridge.canAccess(), true, prefix + ' Dual source grants Garage access.');
  assert.ok(c.SatoriGarageBridge.targets().some(target => target.line === 'garage'), prefix + ' Eligible dual source must also add the Garage target.');
  console.log((prefix || 'live') + ': Garage target with membership on another line passed');
}

(async () => {
  for (const prefix of ['', 'nahlad']) {await check(prefix); await checkTargets(prefix);}
})().catch(error => {console.error(error); process.exitCode = 1;});
