const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const htmlPath = path.join(__dirname, '..', 'gyn_predaje_konverter.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

const elements = new Map();
function el(id) {
  if (!elements.has(id)) {
    elements.set(id, {
      id,
      style: {},
      className: '',
      textContent: '',
      innerHTML: '',
      classList: { add() {}, remove() {} },
      addEventListener() {},
      appendChild() {},
    });
  }
  return elements.get(id);
}

const sandbox = {
  console,
  setTimeout() {},
  URL: { createObjectURL() { return ''; }, revokeObjectURL() {} },
  Blob: function Blob() {},
  document: {
    getElementById: el,
    createElement() { return { style: {}, click() {}, appendChild() {} }; },
  },
  navigator: { clipboard: { writeText() { return Promise.resolve(); } } },
  XLSX: {
    version: 'test',
    utils: {
      sheet_to_json(sheet) {
        return sheet.rows;
      },
    },
  },
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(script + '\nthis.__testApi = { extractCorrectionRowsFromWorkbook };', sandbox);

const rows = [
  ['2.Q', 'Plan', 1, 2, 3, 'Spolu', 'Plnenie'],
  ['GLOBIFER', 'Plan', 1, 2, 3, 'Spolu', 'Plnenie'],
  ['BAPA', 56627, 18109, null, null, 18109, 0.3198],
  ['SEPA', 44897, 13957, null, null, 13957, 0.3109],
  ['Total', 237114, 75705, 0, 0, 75705, 0.3193],
  [],
  ['LEVOSERT', 'Plan', 1, 2, 3, 'Spolu', 'Plnenie'],
  ['ZAPA', 13863, 3740, null, null, 3740, 0.2698],
  ['Total', 79209, 34760, 0, 0, 34760, 0.4388],
  [],
  ['H - Gel', 'Plan', 1, 2, 3, 'Spolu', 'Plnenie'],
  ['BA - OZA', 20000, 1000, null, null, 1000, 0.05],
  ['Total', 89056, 22343, 0, 0, 22343, 0.2509],
];

const result = sandbox.__testApi.extractCorrectionRowsFromWorkbook({
  SheetNames: ['Plnenie 2.Q.2026'],
  Sheets: { 'Plnenie 2.Q.2026': { rows } },
});

const actual = result.map(r => ({
  login: r.login,
  rok: r.rok,
  mesiac: r.mesiac,
  produkt: r.produkt,
  hodnota: r.hodnota,
}));
const expected = [
  { login: 'a.slezackova', rok: 2026, mesiac: 4, produkt: 'Levosert', hodnota: 3740 },
  { login: 'b.sivakova', rok: 2026, mesiac: 4, produkt: 'Papilocare Hgel', hodnota: 1000 },
  { login: 'k.basternakova', rok: 2026, mesiac: 4, produkt: 'Globifer', hodnota: 18109 },
  { login: 'sepa', rok: 2026, mesiac: 4, produkt: 'Globifer', hodnota: 13957 },
];
assert.strictEqual(JSON.stringify(actual), JSON.stringify(expected));

console.log('gyn corrections parser test passed');
