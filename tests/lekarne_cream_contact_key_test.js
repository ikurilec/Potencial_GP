const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const gsPath = path.join(__dirname, '..', 'apps_script', 'kód.gs');
const gs = fs.readFileSync(gsPath, 'utf8');

function extractFunction(name) {
  const start = gs.indexOf(`function ${name}(`);
  assert.notStrictEqual(start, -1, `${name} function not found`);
  const bodyStart = gs.indexOf('{', start);
  let depth = 0;
  for (let i = bodyStart; i < gs.length; i++) {
    if (gs[i] === '{') depth++;
    if (gs[i] === '}') depth--;
    if (depth === 0) return gs.slice(start, i + 1);
  }
  throw new Error(`${name} function end not found`);
}

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(
  extractFunction('lkNormText_') + '\n' +
  extractFunction('lkNormKey_') + '\n' +
  extractFunction('lkContactKeyParts_'),
  sandbox
);

const fromContactSheet = 'Košice 4|||Košice|||Pri Aréne,  Žižkova 3836/1';
const fromLekarneBal = ' košice 4 ||| KOŠICE ||| Pri Aréne, Žižkova 3836/1 ';

assert.strictEqual(
  sandbox.lkNormKey_(fromContactSheet),
  sandbox.lkNormKey_(fromLekarneBal)
);

const hdr = ['month', 'login', 'key', 'okres', 'mesto', 'lekaren', 'contacted_at'];
const row = ['2026-05', 'a.makis', '', 'Košice 4', 'Košice', 'Pri Aréne, Žižkova 3836/1', ''];
assert.strictEqual(
  sandbox.lkNormKey_(sandbox.lkContactKeyParts_(row, hdr)),
  sandbox.lkNormKey_('Košice 4|||Košice|||Pri Aréne, Žižkova 3836/1')
);

console.log('lekarne cream contact key normalization test passed');
