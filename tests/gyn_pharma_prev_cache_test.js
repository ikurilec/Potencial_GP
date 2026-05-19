const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

function extractFunction(name) {
  const re = new RegExp(`function ${name}\\([^)]*\\) \\{[\\s\\S]*?\\n\\}`);
  const match = html.match(re);
  assert(match, `${name} function not found`);
  return match[0];
}

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext([
  extractFunction('gynPharmaKvartalForYymm'),
  extractFunction('gynPharmaYymmsForKvartal'),
  extractFunction('gynPharmaTrendKvartals'),
  extractFunction('gynPharmaCachedOkresyForKvartal'),
  extractFunction('gynPharmaCacheHasPrevOkresy'),
  'this.gynPharmaKvartalForYymm = gynPharmaKvartalForYymm;',
  'this.gynPharmaYymmsForKvartal = gynPharmaYymmsForKvartal;',
  'this.gynPharmaTrendKvartals = gynPharmaTrendKvartals;',
  'this.gynPharmaCacheHasPrevOkresy = gynPharmaCacheHasPrevOkresy;',
].join('\n'), sandbox);

const hasCompleteCache = sandbox.gynPharmaCacheHasPrevOkresy;

const q2TrendSummary = [
  { mesiac: '2510' }, { mesiac: '2511' }, { mesiac: '2512' },
  { mesiac: '2601' }, { mesiac: '2602' }, { mesiac: '2603' },
];

assert.strictEqual(sandbox.gynPharmaKvartalForYymm('2510'), '2504', 'October 2025 belongs to Q4 2025');
assert.deepStrictEqual(Array.from(sandbox.gynPharmaYymmsForKvartal('2601')), [2601, 2602, 2603], 'Q1 months are mapped correctly');
assert.deepStrictEqual(Array.from(sandbox.gynPharmaTrendKvartals(q2TrendSummary)), ['2504', '2601'], 'trend needs Q4 2025 and Q1 2026');

assert.strictEqual(hasCompleteCache(null, '2602'), false, 'missing cache is incomplete');
assert.strictEqual(hasCompleteCache({ ok: true, summary: [] }, '2602'), true, 'cache without trend months is complete');
assert.strictEqual(hasCompleteCache({ ok: true, summary: q2TrendSummary, okresy_extra: { '2601': [{ okres: 'Bratislava I' }] } }, '2602'), false, 'Q4 is still missing');
assert.strictEqual(hasCompleteCache({ ok: true, summary: q2TrendSummary, okresy_extra: { '2504': [], '2601': [{ okres: 'Bratislava I' }] } }, '2602'), false, 'empty Q4 must be retried');
assert.strictEqual(hasCompleteCache({ ok: true, summary: q2TrendSummary, okresy_extra: { '2504': [{ okres: 'Košice I' }], '2601': [{ okres: 'Bratislava I' }] } }, '2602'), true, 'all trend quarters are complete');

console.log('gyn pharma trend quarter cache test passed');
