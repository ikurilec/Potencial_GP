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
vm.runInContext(extractFunction('lkOpportunityProducts'), sandbox);

const info = {
  months: [
    { rok: 2026, mesiac: 1, prods: { suprax: 4 } },
    { rok: 2026, mesiac: 4, prods: { vidonorm: 8 } },
  ],
};

const opps = sandbox.lkOpportunityProducts(info, { rok: 2026, mesiac: 5 }, ['suprax', 'vidonorm', 'kogavant']);

assert.strictEqual(opps.length, 2);
assert.deepStrictEqual(opps.map(o => o.product), ['suprax', 'kogavant']);
assert.strictEqual(opps[0].type, 'stale');
assert.strictEqual(opps[0].monthsAgo, 4);
assert.strictEqual(opps[0].qty, 4);
assert.strictEqual(opps[1].type, 'never');

console.log('lekarne opportunities test passed');
