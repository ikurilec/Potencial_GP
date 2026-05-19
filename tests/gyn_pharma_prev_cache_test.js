const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const fnMatch = html.match(/function gynPharmaCacheHasPrevOkresy\(cached, kvartalPrev\) \{[\s\S]*?\n\}/);
assert(fnMatch, 'gynPharmaCacheHasPrevOkresy function not found');

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(fnMatch[0] + '\nthis.gynPharmaCacheHasPrevOkresy = gynPharmaCacheHasPrevOkresy;', sandbox);

const hasCompleteCache = sandbox.gynPharmaCacheHasPrevOkresy;

assert.strictEqual(hasCompleteCache(null, '2504'), false, 'missing cache is incomplete');
assert.strictEqual(hasCompleteCache({ ok: true }, null), true, 'cache is complete when no previous quarter is needed');
assert.strictEqual(hasCompleteCache({ ok: true }, '2504'), false, 'previous quarter without okresy_prev is incomplete');
assert.strictEqual(hasCompleteCache({ ok: true, okresy_prev: [] }, '2504'), false, 'empty previous quarter okresy must be retried');
assert.strictEqual(hasCompleteCache({ ok: true, okresy_prev: [{ okres: 'Bratislava I' }] }, '2504'), true, 'non-empty previous quarter okresy is complete');

console.log('gyn pharma previous quarter cache test passed');
