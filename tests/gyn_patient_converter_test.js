const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, '..', 'gyn_patient_converter.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const core = script.slice(script.indexOf('var REGION_MAP'), script.indexOf('async function handleFile'));

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(core + '\nthis.extractAppOcRows = extractAppOcRows;', sandbox);

const rows = [
  [],
  ['', '', 'DROVELIS', '', 'EVRA', ''],
  ['', 'Rep', 'Plán Eur', 'Plán Pac.', 'Plán Eur', 'Plán Pac.'],
  ['', 'ocBA', 57540.89, 293.49, 14176.8, 83.55],
  ['', 'Spolu', 57540.89, 293.49, 14176.8, 83.55],
  [],
  ['', '', 'DROVELIS', '', 'EVRA', ''],
  ['REP', 'OKRES', 'Plán Eur', 'Plán Pac.', 'Plán Eur', 'Plán Pac.'],
  ['ocBA', 'Bratislava I', 5964.58, 25.86, 1375.99, 7.51],
  ['ocBA', 'Bratislava II', 11561.01, 55.44, 3549.52, 18.27],
];

const out = sandbox.extractAppOcRows(rows, 2026, 2);

assert.strictEqual(out.length, 6, 'territory and district product rows are exported');
assert.deepStrictEqual(
  { region: out[0].region, produkt: out[0].produkt, okres: out[0].okres, Q: out[0].Q },
  { region: 'BAPI', produkt: 'DROVELIS', okres: '', Q: 2 },
  'territory row maps ocBA to BAPI'
);
assert.strictEqual(out[0].eur_na_pacienta > 190 && out[0].eur_na_pacienta < 200, true, 'eur per patient is computed');
assert.deepStrictEqual(
  { region: out[2].region, produkt: out[2].produkt, okres: out[2].okres },
  { region: 'BAPI', produkt: 'DROVELIS', okres: 'Bratislava I' },
  'district row keeps okres'
);

console.log('gyn patient converter test passed');
