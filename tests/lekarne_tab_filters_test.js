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
  extractFunction('lkChainNameFlags') + '\n' +
  extractFunction('lkIsChainHiddenInTab'),
  sandbox
);

const drMax = { lekaren: 'Dr. Max Lekaren, Hlavna 1' };
const drMaxNoDot = { lekaren: 'DR MAX - OC Galeria' };
const benu = { lekaren: 'BENU Lekaren Namestie' };
const independent = { lekaren: 'Lekaren U Salvatora' };

assert.strictEqual(sandbox.lkIsChainHiddenInTab(drMax, 'sleeping'), true);
assert.strictEqual(sandbox.lkIsChainHiddenInTab(drMaxNoDot, 'reaktivacia'), true);
assert.strictEqual(sandbox.lkIsChainHiddenInTab(drMax, 'priority'), true);
assert.strictEqual(sandbox.lkIsChainHiddenInTab(drMax, 'new'), false);
assert.strictEqual(sandbox.lkIsChainHiddenInTab(drMax, 'all'), false);

assert.strictEqual(sandbox.lkIsChainHiddenInTab(benu, 'priority'), true);
assert.strictEqual(sandbox.lkIsChainHiddenInTab(benu, 'sleeping'), false);
assert.strictEqual(sandbox.lkIsChainHiddenInTab(benu, 'reaktivacia'), false);
assert.strictEqual(sandbox.lkIsChainHiddenInTab(benu, 'new'), false);
assert.strictEqual(sandbox.lkIsChainHiddenInTab(benu, 'all'), false);

assert.strictEqual(sandbox.lkIsChainHiddenInTab(independent, 'sleeping'), false);
assert.strictEqual(sandbox.lkIsChainHiddenInTab(independent, 'reaktivacia'), false);
assert.strictEqual(sandbox.lkIsChainHiddenInTab(independent, 'priority'), false);

console.log('lekarne tab filters test passed');
