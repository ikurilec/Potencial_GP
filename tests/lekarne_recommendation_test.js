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

const sandbox = {
  LK_PROD_DISPLAY: {
    aflamil_tb: 'AFL tbl.',
    aflamil_kr: 'AFL krem',
    suprax: 'Suprax',
    vidonorm: 'Vidonorm',
    telexer: 'Telexer',
    kogavant: 'Kogavant',
  },
  LK_MES_NAMES: { 3: 'Mar', 4: 'Apr', 5: 'Máj' },
};
vm.createContext(sandbox);
vm.runInContext(
  extractFunction('lkDobropisLabel') + '\n' +
  extractFunction('lkMonthsWord') + '\n' +
  extractFunction('lkPriorityLabel') + '\n' +
  extractFunction('lkCacheKey') + '\n' +
  extractFunction('lkCurrentYearMonth') + '\n' +
  extractFunction('lkCreamLast3') + '\n' +
  extractFunction('lkCreamLast3Text') + '\n' +
  extractFunction('lkCreamContactMonthKey') + '\n' +
  extractFunction('lkCreamContactedKey') + '\n' +
  extractFunction('lkIsCreamContacted') + '\n' +
  extractFunction('lkReaktivaciaSort') + '\n' +
  extractFunction('lkRecommendation'),
  sandbox
);

const allThreeLabel = sandbox.lkDobropisLabel({ count: 3, missing: [] });
assert.strictEqual(allThreeLabel, 'všetky tri produkty');

const staleCream = sandbox.lkRecommendation({
  isReaktivacia: true,
  krmMonthsAgo: 4,
  monthsAgo: 4,
}, 'reaktivacia');

assert.strictEqual(staleCream.priority, 'high');
assert.match(staleCream.reason, /AFL krém nekúpili 4 mesiace/);
assert.match(staleCream.action, /rabatovou akciou na AFL krém/);

const creamPotential = sandbox.lkRecommendation({
  isKrmPotential: true,
  aflTblSachAvg: 9,
}, 'reaktivacia');

assert.strictEqual(creamPotential.priority, 'high');
assert.match(creamPotential.reason, /Berie AFL tbl\.\/sáč\./);
assert.match(creamPotential.action, /doplnok k tabletkám\/sáčkom/);

const dobropis = sandbox.lkRecommendation({
  priorityMeta: {
    count: 2,
    missing: ['kogavant'],
    totals: { vidonorm: 8, telexer: 5 },
    total: 13,
  },
}, 'priority');

assert.strictEqual(dobropis.priority, 'medium');
assert.match(dobropis.reason, /Chýba Kogavant/);
assert.strictEqual(dobropis.action, 'Zisti možnosti dobropisu aj pre chýbajúce produkty, možno majú práve konkurenciu.');

const allThreeDobropis = sandbox.lkRecommendation({
  priorityMeta: {
    count: 3,
    missing: [],
    totals: { vidonorm: 8, telexer: 5, kogavant: 6 },
    total: 19,
  },
}, 'priority');

assert.match(allThreeDobropis.reason, /berú všetky tri produkty/);
assert.strictEqual(allThreeDobropis.action, 'Zistiť ako sú na tom konkurenčné produkty, v prípade že je tam odber, tak skúsiť dobropis.');

const sleeping = sandbox.lkRecommendation({
  monthsAgo: 5,
}, 'sleeping');

assert.strictEqual(sleeping.priority, 'high');
assert.match(sleeping.reason, /Bez nákupu 5 mesiacov/);

const contactedStore = {};
sandbox.localStorage = {
  getItem: key => contactedStore[key] || null,
};
contactedStore[sandbox.lkCreamContactedKey('rep-a', 'lekaren-1', { rok: 2026, mesiac: 5 })] = '1';
assert.strictEqual(sandbox.lkIsCreamContacted('rep-a', 'lekaren-1', { rok: 2026, mesiac: 5 }), true);
assert.strictEqual(sandbox.lkIsCreamContacted('rep-a', 'lekaren-1', { rok: 2026, mesiac: 6 }), false);

contactedStore[sandbox.lkCreamContactedKey(null, 'done')] = '1';
const sortedCream = [
  { key: 'done', isReaktivacia: true, monthsAgo: 2, krmMonthsAgo: 2 },
  { key: 'fresh', isReaktivacia: true, monthsAgo: 4, krmMonthsAgo: 4 },
].sort(sandbox.lkReaktivaciaSort).map(x => x.key);

assert.deepStrictEqual(sortedCream, ['fresh', 'done']);

const creamLast3 = sandbox.lkCreamLast3({
  months: [
    { rok: 2026, mesiac: 3, prods: { aflamil_kr: 2 } },
    { rok: 2026, mesiac: 4, prods: { aflamil_kr: 5 } },
    { rok: 2026, mesiac: 5, prods: { aflamil_tb: 3 } },
  ],
}, { rok: 2026, mesiac: 5 });

assert.deepStrictEqual(JSON.parse(JSON.stringify(creamLast3)), [
  { rok: 2026, mesiac: 3, qty: 2 },
  { rok: 2026, mesiac: 4, qty: 5 },
  { rok: 2026, mesiac: 5, qty: 0 },
]);
assert.strictEqual(sandbox.lkCreamLast3Text(creamLast3), 'Mar: 2 bal. · Apr: 5 bal. · Máj: 0 bal.');

console.log('lekarne recommendation test passed');
