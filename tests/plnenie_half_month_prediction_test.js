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

function mockDate(iso) {
  const RealDate = Date;
  return class MockDate extends RealDate {
    constructor(...args) {
      if (args.length) super(...args);
      else super(iso);
    }
    static now() { return new RealDate(iso).getTime(); }
    static parse(v) { return RealDate.parse(v); }
    static UTC(...args) { return RealDate.UTC(...args); }
  };
}

function buildSandbox(iso) {
  const sandbox = { Date: mockDate(iso) };
  vm.createContext(sandbox);
  vm.runInContext(
    'var PL_WORKING_DAYS_MAP = { 2026: { 1:20, 2:20, 3:22, 4:20, 5:20, 6:22, 7:23, 8:21, 9:21, 10:22, 11:21, 12:21 } };' +
    'var PL_WORKING_DAYS_HALF_MAP = { 2026: { 1:9, 2:10, 3:10, 4:9, 5:9, 6:11, 7:11, 8:10, 9:9, 10:11, 11:10, 12:11 } };' +
    extractFunction('plnenieCurrentQ') + '\n' +
    extractFunction('plnenieWorkingDays') + '\n' +
    extractFunction('plnenieWorkingDaysHalf') + '\n' +
    extractFunction('plnenieQuarterMonths') + '\n' +
    extractFunction('plnenieWorkingDaysForMonths') + '\n' +
    extractFunction('plnenieMonthHasSales') + '\n' +
    extractFunction('plneniePredictionMonthParts') + '\n' +
    extractFunction('plneniePlanForPredictionParts') + '\n' +
    extractFunction('plnenieActualForPredictionParts') + '\n' +
    extractFunction('plnenieCalcPredikcia'),
    sandbox
  );
  return sandbox;
}

const may = buildSandbox('2026-05-18T10:00:00+02:00');
assert.strictEqual(may.plnenieWorkingDaysHalf(2026, 5), 9);
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(may.plneniePredictionMonthParts(2, 2026, { 4: { aflamil_kr: 2000 }, 5: { aflamil_kr: 450 } }))),
  [{ month: 4, mode: 'full' }, { month: 5, mode: 'half' }]
);

const mayPred = may.plnenieCalcPredikcia(2, 2026, 6200, {
  4: { aflamil_kr: 2000 },
  5: { aflamil_kr: 450 }
}, 'aflamil_kr');
assert.strictEqual(Math.round(mayPred * 100) / 100, 84.48);

const june = buildSandbox('2026-06-05T10:00:00+02:00');
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(june.plneniePredictionMonthParts(2, 2026, { 4: { aflamil_kr: 2000 }, 5: { aflamil_kr: 2000 } }))),
  [{ month: 4, mode: 'full' }, { month: 5, mode: 'full' }]
);
const junePred = june.plnenieCalcPredikcia(2, 2026, 6200, {
  4: { aflamil_kr: 2000 },
  5: { aflamil_kr: 2000 }
}, 'aflamil_kr');
assert.strictEqual(Math.round(junePred * 100) / 100, 100);

console.log('plnenie half-month prediction test passed');
