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
  extractFunction('lkIsChainHiddenInTab') + '\n' +
  extractFunction('lkDobropisSort') + '\n' +
  extractFunction('lkReaktivaciaSort') + '\n' +
  extractFunction('lkMgrVisibleList') + '\n' +
  extractFunction('lkMgrTabCounts') + '\n' +
  extractFunction('lkMgrEmptyMsg'),
  sandbox
);

const rows = [
  {
    lekaren: 'Dr. Max Alfa',
    mesto: 'Bratislava',
    okres: 'Bratislava',
    isSleeping: false,
    isNew: false,
    isReaktivacia: true,
    isKrmPotential: false,
    isPriority: false,
    priorityMeta: { group: 0, total: 0, count: 0 },
    krmMonthsAgo: 4,
    aflTblSachAvg: 0,
    buys: ['aflamil_tb'],
    missing: [],
    monthsAgo: 2,
    trend: 'up',
    lastM: { mesiac: 3, rok: 2026 },
    months: [{ rok: 2026, mesiac: 3 }],
  },
  {
    lekaren: 'BENU Beta',
    mesto: 'Košice',
    okres: 'Košice',
    isSleeping: false,
    isNew: false,
    isReaktivacia: false,
    isKrmPotential: false,
    isPriority: true,
    priorityMeta: { group: 3, total: 90, count: 3 },
    krmMonthsAgo: -1,
    aflTblSachAvg: 0,
    buys: ['vidonorm', 'telexer', 'kogavant'],
    missing: [],
    monthsAgo: 1,
    trend: 'up',
    lastM: { mesiac: 5, rok: 2026 },
    months: [{ rok: 2026, mesiac: 5 }],
  },
  {
    lekaren: 'Ryeqo',
    mesto: 'Trenčín',
    okres: 'Trenčín',
    isSleeping: false,
    isNew: false,
    isReaktivacia: false,
    isKrmPotential: false,
    isPriority: true,
    priorityMeta: { group: 2, total: 70, count: 2 },
    krmMonthsAgo: -1,
    aflTblSachAvg: 0,
    buys: ['vidonorm', 'telexer'],
    missing: [],
    monthsAgo: 1,
    trend: 'up',
    lastM: { mesiac: 5, rok: 2026 },
    months: [{ rok: 2026, mesiac: 5 }],
  },
  {
    lekaren: 'Apollo',
    mesto: 'Nitra',
    okres: 'Nitra',
    isSleeping: true,
    isNew: false,
    isReaktivacia: false,
    isKrmPotential: true,
    isPriority: false,
    priorityMeta: { group: 0, total: 0, count: 0 },
    krmMonthsAgo: -1,
    aflTblSachAvg: 55,
    buys: ['aflamil_tb', 'suprax'],
    missing: [],
    monthsAgo: 6,
    trend: 'dn',
    lastM: { mesiac: 11, rok: 2025 },
    months: [{ rok: 2025, mesiac: 11 }],
  },
  {
    lekaren: 'Delta',
    mesto: 'Žilina',
    okres: 'Žilina',
    isSleeping: false,
    isNew: true,
    isReaktivacia: false,
    isKrmPotential: false,
    isPriority: false,
    priorityMeta: { group: 0, total: 0, count: 0 },
    krmMonthsAgo: -1,
    aflTblSachAvg: 0,
    buys: ['suprax'],
    missing: [],
    monthsAgo: 0,
    trend: 'up',
    lastM: { mesiac: 5, rok: 2026 },
    months: [{ rok: 2026, mesiac: 5 }],
  },
];

const counts = sandbox.lkMgrTabCounts(rows);
assert.strictEqual(counts.sleeping, 1);
assert.strictEqual(counts.new, 1);
assert.strictEqual(counts.reaktivacia, 1);
assert.strictEqual(counts.priority, 1);
assert.strictEqual(counts.all, 5);

assert.deepStrictEqual(
  sandbox.lkMgrVisibleList(rows, '', 'reaktivacia').map(r => r.lekaren),
  ['Apollo']
);
const priorityVisible = sandbox.lkMgrVisibleList(rows, '', 'priority').map(r => r.lekaren);
assert.deepStrictEqual(priorityVisible, ['Ryeqo']);

const allVisible = sandbox.lkMgrVisibleList(rows, '', 'all').map(r => r.lekaren);
assert.deepStrictEqual(allVisible, ['Apollo', 'BENU Beta', 'Delta', 'Dr. Max Alfa', 'Ryeqo']);

assert.strictEqual(sandbox.lkMgrEmptyMsg('priority'), 'Žiadne lekárne na dobropis');

console.log('lekarne manager tabs test passed');
