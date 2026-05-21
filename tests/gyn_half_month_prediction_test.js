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
    'var PL_WORKING_DAYS_HALF_MAP = { 2026: { 1:9, 2:10, 3:10, 4:9, 5:10, 6:11, 7:11, 8:10, 9:9, 10:11, 11:10, 12:11 } };' +
    'var GYN_EXCLUDE_FROM_TOTALS = { escapelle: 1, daylla: 1 };' +
    extractFunction('plnenieCurrentQ') + '\n' +
    extractFunction('plnenieWorkingDays') + '\n' +
    extractFunction('plnenieWorkingDaysHalf') + '\n' +
    extractFunction('plnenieQuarterMonths') + '\n' +
    extractFunction('plnenieWorkingDaysForMonths') + '\n' +
    extractFunction('plnenieMonthHasSales') + '\n' +
    extractFunction('plneniePredictionMonthParts') + '\n' +
    extractFunction('plneniePlanForPredictionParts') + '\n' +
    extractFunction('plnenieActualForPredictionParts') + '\n' +
    extractFunction('plnenieCalcPredikciaSummary') + '\n' +
    extractFunction('gynPredictionProductKeys') + '\n' +
    extractFunction('gynPredictionBasisForRep'),
    sandbox
  );
  return sandbox;
}

const data = {
  planProducts: ['Globifer', 'Levosert', 'Escapelle'],
  predajeProducts: ['Globifer', 'Levosert', 'Escapelle'],
  plan: {
    rep1: { globifer: 6200, levosert: 3100, escapelle: 1000 }
  },
  predaje: {
    rep1: {
      total: { globifer: 2450, levosert: 1225, escapelle: 400 },
      byMonth: {
        4: { globifer: 2000, levosert: 1000, escapelle: 300 },
        5: { globifer: 450, levosert: 225, escapelle: 100 }
      }
    }
  }
};

const may = buildSandbox('2026-05-18T10:00:00+02:00');
const mayBasis = may.gynPredictionBasisForRep('rep1', data, 2, 2026);
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(mayBasis.parts)),
  [{ month: 4, mode: 'full' }, { month: 5, mode: 'half' }]
);
assert.strictEqual(Math.round(mayBasis.planBasis), 4500);
assert.strictEqual(mayBasis.actual, 3675);
assert.strictEqual(Math.round((mayBasis.actual / mayBasis.planBasis * 100) * 100) / 100, 81.67);

const june = buildSandbox('2026-06-05T10:00:00+02:00');
const juneBasis = june.gynPredictionBasisForRep('rep1', data, 2, 2026);
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(juneBasis.parts)),
  [{ month: 4, mode: 'full' }, { month: 5, mode: 'full' }]
);
assert.strictEqual(Math.round(juneBasis.planBasis), 6000);
assert.strictEqual(juneBasis.actual, 3675);

console.log('gyn half-month prediction test passed');
