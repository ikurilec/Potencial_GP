const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

function extractFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  assert.notStrictEqual(start, -1, `${name} function not found`);
  const bodyStart = html.indexOf('{', start);
  let depth = 0;
  for (let i = bodyStart; i < html.length; i++) {
    if (html[i] === '{') depth++;
    if (html[i] === '}') depth--;
    if (depth === 0) return html.slice(start, i + 1);
  }
  throw new Error(`${name} function end not found`);
}

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(
  'var PL_PACK_PRICES = { aflamil_kr:{price:5.35,label:"bal. krému"}, suprax:{price:12.82,label:"bal. Suprax 400 mg"}, cavinton:{price:10.85,label:"bal. Cavinton Forte 90 tbl."}, kogavant:{price:19.88,label:"bal. Kogavant 90 mg 56 tbl."}, vidonorm:{price:8.80,label:"bal. Vidonorm 4/5 mg 90 tbl."}, telexer:{price:72.12,label:"bal. Telexer 150 mg 180 tbl."}, junod:{price:90.38,label:"bal. Junod"} };' +
  extractFunction('plnenieNormalizeKey') + '\n' +
  extractFunction('plnenieFormatEUR') + '\n' +
  extractFunction('plneniePackCount') + '\n' +
  extractFunction('plnenieAflamilMixFromTotals') + '\n' +
  extractFunction('plnenieAflamilMixFromContext') + '\n' +
  extractFunction('plneniePackHint'),
  sandbox
);

assert.strictEqual(
  sandbox.plneniePackHint('aflamil_kr', 7728, 3445),
  'do splnenia plánu chýba 4 283 € ≈ 801 bal. krému'
);

assert.strictEqual(
  sandbox.plneniePackHint('kogavant', 2900, 0),
  'do splnenia plánu chýba 2 900 € ≈ 146 bal. Kogavant 90 mg 56 tbl.'
);

assert.strictEqual(
  sandbox.plneniePackHint('suprax', 5000, 5000),
  'plán je splnený'
);

assert.deepStrictEqual(
  JSON.parse(JSON.stringify(sandbox.plnenieAflamilMixFromTotals({ aflamiltb: 60, aflamilsa: 40 }))),
  { tb: 0.6, sa: 0.4 }
);

assert.strictEqual(
  sandbox.plneniePackHint('aflamil_tablety_sacky', 1000, 0, { mixTotals: { aflamiltb: 60, aflamilsa: 40 } }),
  'do splnenia plánu chýba 1 000 € ≈ 189 bal. Aflamil tbl. 30 ks + 98 bal. sáčkov podľa mixu minulého Q'
);

console.log('plnenie pack hint test passed');
