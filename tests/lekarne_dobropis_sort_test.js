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
  extractFunction('lkDobropisMeta') + '\n' +
  extractFunction('lkDobropisSort'),
  sandbox
);

const now = { rok: 2026, mesiac: 5 };
const mkInfo = months => ({ months });

const allThreeHigh = sandbox.lkDobropisMeta(mkInfo([
  { rok: 2026, mesiac: 3, prods: { vidonorm: 10, telexer: 8, kogavant: 6 } },
  { rok: 2026, mesiac: 4, prods: { vidonorm: 20, telexer: 10, kogavant: 5 } },
  { rok: 2026, mesiac: 5, prods: { vidonorm: 30, telexer: 12, kogavant: 8 } },
]), now);

const allThreeLow = sandbox.lkDobropisMeta(mkInfo([
  { rok: 2026, mesiac: 3, prods: { vidonorm: 5, telexer: 3, kogavant: 2 } },
  { rok: 2026, mesiac: 5, prods: { vidonorm: 8, telexer: 4, kogavant: 1 } },
]), now);

const twoProd = sandbox.lkDobropisMeta(mkInfo([
  { rok: 2026, mesiac: 4, prods: { vidonorm: 12, telexer: 7 } },
  { rok: 2026, mesiac: 5, prods: { vidonorm: 4 } },
]), now);

const oneProd = sandbox.lkDobropisMeta(mkInfo([
  { rok: 2026, mesiac: 4, prods: { kogavant: 15 } },
]), now);

const stale = sandbox.lkDobropisMeta(mkInfo([
  { rok: 2026, mesiac: 1, prods: { vidonorm: 100 } },
]), now);

assert.strictEqual(allThreeHigh.count, 3);
assert.strictEqual(allThreeHigh.missing.join(','), '');
assert.strictEqual(allThreeLow.count, 3);
assert.strictEqual(twoProd.count, 2);
assert.strictEqual(JSON.stringify(twoProd.missing), JSON.stringify(['kogavant']));
assert.strictEqual(oneProd.count, 1);
assert.strictEqual(JSON.stringify(oneProd.missing.slice().sort()), JSON.stringify(['telexer', 'vidonorm']));
assert.strictEqual(stale.count, 0);

const sorted = [
  { name: 'two', meta: twoProd },
  { name: 'stale', meta: stale },
  { name: 'allThreeLow', meta: allThreeLow },
  { name: 'one', meta: oneProd },
  { name: 'allThreeHigh', meta: allThreeHigh },
].sort((a, b) => sandbox.lkDobropisSort(a.meta, b.meta))
 .map(x => x.name);

assert.deepStrictEqual(sorted, ['allThreeHigh', 'allThreeLow', 'two', 'one', 'stale']);

console.log('lekarne dobropis sort test passed');
