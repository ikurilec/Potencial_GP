const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function extractFunction(name) {
  const re = new RegExp(`function ${name}\\([^)]*\\) \\{[\\s\\S]*?\\n\\}`);
  const match = html.match(re);
  assert(match, `${name} function not found`);
  return match[0];
}

const sandbox = {
  GYN_APP: { q: 2 },
  PL_MONTH_LABELS: { 4: 'Apr', 5: 'Máj', 6: 'Jún' },
};
vm.createContext(sandbox);
vm.runInContext([
  'function gynEsc(s){ return String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }',
  extractFunction('gynPatientRegionForLookup'),
  extractFunction('gynPatientPlan'),
  extractFunction('gynPatientFmt'),
  extractFunction('gynPatientFmtMissing'),
  extractFunction('gynPatientCurrentLabel'),
  extractFunction('gynPatientProductHint'),
  extractFunction('gynPatientDistrictList'),
  'this.gynPatientProductHint = gynPatientProductHint;',
  'this.gynPatientDistrictList = gynPatientDistrictList;',
].join('\n'), sandbox);

const data = {
  pacienti: {
    territory: {
      BAPI: {
        belara: {
          plan_eur: 33817,
          plan_pacienti: 182,
          eur_na_pacienta: 185.8,
        },
      },
    },
    districts: {
      BAPI: {
        belara: {
          'bratislava i': { plan_eur: 3968, plan_pacienti: 20.6 },
          'bratislava ii': { plan_eur: 8874, plan_pacienti: 46.2 },
        },
      },
    },
  },
};

const out = sandbox.gynPatientProductHint(data, 'BAPI', 'belara', 10314, 33817, { 4: { belara: 10314 } }, 2);

assert(out.includes('Plán pacienti'), 'plan label is explicit');
assert(out.includes('182 pacientov'), 'plan has patient unit');
assert(out.includes('Aktuálne Apr'), 'current label includes loaded month');
assert(out.includes('>56 pacientov</strong>'), 'current value has patient unit without cca');
assert(out.includes('Do konca Q2 chýba'), 'remaining label names the quarter');
assert(out.includes('>127 pacientov</strong>'), 'remaining value has patient unit without cca');
assert(!out.includes('cca'), 'patient hint does not use cca wording');

const districts = sandbox.gynPatientDistrictList(data, 'BAPI', 'belara');
assert.strictEqual(districts.length, 2, 'district patient plans are listed');
assert.strictEqual(districts[0].okres, 'bratislava ii', 'districts are sorted by patient plan descending');
assert.strictEqual(sandbox.gynPatientDistrictList(data, 'BAPA', 'belara').length, 2, 'patch twin region can read pill patient plans');

console.log('gyn patient hint test passed');
