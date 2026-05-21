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
  extractFunction('gynPharmaYymmsForKvartal') + '\n' +
  extractFunction('gynPharmaRowsByKvartal') + '\n' +
  extractFunction('gynPharmaDistrictMonthMap') + '\n' +
  extractFunction('gynPharmaDistrictDisplayYymms') + '\n' +
  'function plnenieCurrentQ(){ return 2; }\n' +
  extractFunction('gynPharmaDistrictDisplayYymmsForQ'),
  sandbox
);

const resp = {
  okresy: [{
    okres: 'Bratislava I',
    nas_m1: 6.33, nas_m2: 0, nas_m3: 0,
    k1: { name: 'DROVELIS', m1: 8.44, m2: 0, m3: 0 }
  }],
  okresy_extra: {
    '2601': [{
      okres: 'Bratislava I',
      nas_m1: 4.5, nas_m2: 5.1, nas_m3: 5.8,
      k1: { name: 'DROVELIS', m1: 7.2, m2: 7.8, m3: 8.1 }
    }]
  }
};

assert.deepStrictEqual(
  JSON.parse(JSON.stringify(sandbox.gynPharmaDistrictDisplayYymmsForQ(2, resp, '2602', [2604, 2605, 2606]))),
  [2602, 2603, 2604],
  'with only April in Q2, district table uses Feb-Mar-Apr'
);

assert.deepStrictEqual(
  JSON.parse(JSON.stringify(sandbox.gynPharmaDistrictDisplayYymmsForQ(1, resp, '2601', [2601, 2602, 2603]))),
  [2601, 2602, 2603],
  'past Q1 keeps its own Jan-Feb-Mar columns'
);

const map = sandbox.gynPharmaDistrictMonthMap(resp, '2602');
assert.strictEqual(map.districts['Bratislava I'].nas[2602], 5.1);
assert.strictEqual(map.districts['Bratislava I'].nas[2604], 6.33);
assert.strictEqual(map.districts['Bratislava I'].comps.DROVELIS[2603], 8.1);

console.log('gyn pharma district months test passed');
