const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const gsPath = path.join(__dirname, '..', 'apps_script', 'kód_gyn.gs');
const source = fs.readFileSync(gsPath, 'utf8');

const sandbox = {
  console,
  ContentService: { createTextOutput() { return { setMimeType() { return this; } }; }, MimeType: { JSON: 'json', TEXT: 'text' } },
  PropertiesService: { getScriptProperties() { return { getProperty() { return null; } }; } },
  SpreadsheetApp: { getActive() { return null; } },
};
vm.createContext(sandbox);
vm.runInContext(source + '\nthis.__testApi = { applyPredajeCorrections };', sandbox);

const predajeByRep = {
  'k.basternakova': {
    total: { globifer: 300, levosert: 50 },
    byMonth: {
      4: { globifer: 100, levosert: 50 },
      5: { globifer: 200 },
    },
  },
};

sandbox.__testApi.applyPredajeCorrections(predajeByRep, [
  ['login','meno','rok','mesiac','produkt','hodnota','zdroj'],
  ['k.basternakova','Katarina',2026,4,'Globifer',18109,'test'],
  ['k.basternakova','Katarina',2026,5,'Globifer',0,'test'],
  ['k.basternakova','Katarina',2025,4,'Globifer',999,'wrong year'],
  ['k.basternakova','Katarina',2026,4,'Unknown',777,'unknown product still normalized'],
], 2026, [4,5,6]);

assert.strictEqual(predajeByRep['k.basternakova'].byMonth[4].globifer, 18109);
assert.strictEqual(predajeByRep['k.basternakova'].byMonth[5].globifer, 0);
assert.strictEqual(predajeByRep['k.basternakova'].byMonth[4].levosert, 50);
assert.strictEqual(predajeByRep['k.basternakova'].total.globifer, 18109);
assert.strictEqual(predajeByRep['k.basternakova'].total.levosert, 50);

console.log('gyn corrections overlay test passed');
