const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

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
  extractFunction('pharmaQuarterMonths') + '\n' +
  extractFunction('pharmaRowsByKvartal') + '\n' +
  extractFunction('pharmaDistrictMonthMap') + '\n' +
  extractFunction('pharmaDistrictDisplayMonths') + '\n' +
  'function plnenieCurrentQ(){ return 2; }\n' +
  extractFunction('pharmaDistrictDisplayMonthsForQ'),
  sandbox
);

const resp = {
  okresy: [{
    okres: 'Bratislava I',
    nas_m1: 6.33, nas_m2: 0, nas_m3: 0,
    k1: { name: 'DOLGIT', m1: 8.44, m2: 0, m3: 0 }
  }],
  okresy_prev: [{
    okres: 'Bratislava I',
    nas_m1: 4.5, nas_m2: 5.1, nas_m3: 5.8,
    k1: { name: 'DOLGIT', m1: 7.2, m2: 7.8, m3: 8.1 }
  }],
  kvartal_prev: '2601'
};

assert.deepStrictEqual(
  JSON.parse(JSON.stringify(sandbox.pharmaDistrictDisplayMonthsForQ(2, resp, '2602', ['2604', '2605', '2606']))),
  ['2602', '2603', '2604'],
  'current Q with only April uses Feb-Mar-Apr'
);

assert.deepStrictEqual(
  JSON.parse(JSON.stringify(sandbox.pharmaDistrictDisplayMonthsForQ(1, resp, '2601', ['2601', '2602', '2603']))),
  ['2601', '2602', '2603'],
  'past Q keeps own quarter months'
);

const map = sandbox.pharmaDistrictMonthMap(resp, '2602');
assert.strictEqual(map.districts['Bratislava I'].nas['2602'], 5.1);
assert.strictEqual(map.districts['Bratislava I'].nas['2604'], 6.33);
assert.strictEqual(map.districts['Bratislava I'].comps.DOLGIT['2603'], 8.1);

console.log('pharma district months test passed');
