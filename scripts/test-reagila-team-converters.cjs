'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const converterDir = process.env.SATORI_CONVERTER_DIR || path.resolve(root, '../../REAGILA konvertore');
const pharmacyPath = path.join(converterDir, 'reagila_lekarne_konverter.html');
const salesPath = path.join(converterDir, 'reagila_predaje_konverter.html');
if (!process.env.SATORI_CONVERTER_DIR && !fs.existsSync(converterDir)) {
  console.log('SKIP Reagila converter tests: private converter directory is unavailable.');
  process.exit(0);
}
assert.ok(fs.existsSync(pharmacyPath), 'Private pharmacy converter must be available');
assert.ok(fs.existsSync(salesPath), 'Private sales converter must be available');

const pharmacyKey = 'reagila_lekarne_konverter_region_rep';
const salesKey = 'reagila_predaje_konverter_rep_map';
const legacyKey = 'reagila_predaje_konverter_rep_map_legacy';
const backupSuffix = '_backup_west_east_v1';
const migrationSuffix = '_west_east_v1';
const oldPharmacy = {
  BA: { login: 'm.sibert', meno: 'Michaela Sibert', team: 'KAM' },
  SE: { login: 'z.bernatova', meno: 'Zuzana Bernátová', team: 'KAM' },
  ST: { login: 'l.hricova', meno: 'Ľudmila Hricová', team: 'KAM' },
  VY: { login: 'l.faber', meno: 'Lenka Fáber', team: 'KAM' }
};
const expectedPharmacy = {
  BA: { login: 'm.sibert', meno: 'Michaela Sibert', team: 'west' },
  SE: { login: 'z.bernatova', meno: 'Zuzana Bernátová', team: 'west' },
  ST: { login: 'l.hricova', meno: 'Ľudmila Hricová', team: 'east' },
  VY: { login: 'p.papcun', meno: 'Peter Papcun', team: 'east' }
};
const oldSales = { BA: 'm.sibert', SE: 'z.bernatova', ST: 'l.hricova', VY: 'l.faber' };
const expectedSales = { ...oldSales, VY: 'p.papcun' };
const copy = value => JSON.parse(JSON.stringify(value));

function storage(initial = {}, mode = '') {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem(key) {
      if (mode === 'unavailable') throw new Error('Storage unavailable');
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      if (mode === 'unavailable' || mode === 'readOnly') throw new Error('Storage unavailable');
      data.set(key, String(value));
    }
  };
}

function load(file, localStorage, afterInit = '') {
  const pharmacy = file === pharmacyPath;
  const html = fs.readFileSync(file, 'utf8');
  const start = html.indexOf(pharmacy ? 'const REGION_REP_DEFAULTS = ' : 'const REP_MAP_DEFAULTS = ');
  const end = html.indexOf('\nfunction repMapReset()', start);
  assert.ok(start >= 0 && end > start, 'Mapping initialization must be identifiable');
  const context = vm.createContext(localStorage === undefined ? {} : { localStorage });
  vm.runInContext(html.slice(start, end), context, { filename: path.basename(file), timeout: 1000 });
  if (afterInit) vm.runInContext(afterInit, context, { timeout: 1000 });
  return copy(vm.runInContext(pharmacy
    ? '({ map: REGION_REP, west: getAmWestLogins(), east: getAmEastLogins() })'
    : '({ map: REP_MAP })', context));
}

let passed = 0;
let failed = 0;
function test(name, action) {
  try { action(); passed++; console.log('PASS ' + name); }
  catch (error) { failed++; console.error('FAIL ' + name + ': ' + error.message); }
}

test('all inline JavaScript in both private converters parses', () => {
  for (const file of [pharmacyPath, salesPath]) {
    const html = fs.readFileSync(file, 'utf8');
    for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
      new vm.Script(match[1], { filename: path.basename(file) });
    }
  }
});

test('fresh defaults assign BA/SE West, ST/VY East and Peter to VY', () => {
  const pharmacy = load(pharmacyPath, storage());
  assert.deepEqual(pharmacy.map, expectedPharmacy);
  assert.deepEqual(pharmacy.west, ['m.sibert', 'z.bernatova']);
  assert.deepEqual(pharmacy.east, ['l.hricova', 'p.papcun']);
  assert.deepEqual(load(salesPath, storage()).map, expectedSales);
});

test('saved old defaults migrate once with exact original backups', () => {
  for (const [file, key, oldMap, expected] of [
    [pharmacyPath, pharmacyKey, oldPharmacy, expectedPharmacy],
    [salesPath, salesKey, oldSales, expectedSales]
  ]) {
    const original = JSON.stringify(oldMap, null, 2);
    const store = storage({ [key]: original, historical_import: 'l.faber\t2025\t123' });
    assert.deepEqual(load(file, store).map, expected);
    assert.equal(store.getItem(key + backupSuffix), original);
    assert.equal(store.getItem(key + migrationSuffix), '1');
    assert.deepEqual(JSON.parse(store.getItem(key)), expected);
    const after = [...store.data];
    assert.deepEqual(load(file, store).map, expected);
    assert.deepEqual([...store.data], after, 'Second run must not rewrite any storage');
    assert.equal(store.getItem('historical_import'), 'l.faber\t2025\t123');
  }
});

test('custom login/name/team fields and unrelated entries survive migration', () => {
  const saved = copy(oldPharmacy);
  saved.BA.meno = 'Vlastné meno';
  saved.SE.team = 'vlastny-tim';
  saved.ST.login = 'custom.login';
  saved.VY.meno = 'Vlastné meno VY';
  saved.extra = { login: 'custom.extra', note: 'Keep' };
  const store = storage({ [pharmacyKey]: JSON.stringify(saved) });
  const expected = copy(saved);
  expected.BA.team = 'west';
  expected.VY.login = 'p.papcun';
  expected.VY.team = 'east';
  assert.deepEqual(load(pharmacyPath, store).map, expected);
  const customSales = { ...oldSales, BA: 'custom.ba', VY: 'custom.vy', extra: 'keep' };
  assert.deepEqual(load(salesPath, storage({ [salesKey]: JSON.stringify(customSales) })).map, customSales);
  const customVY = copy(oldPharmacy);
  customVY.VY.login = 'custom.vy';
  assert.deepEqual(load(pharmacyPath, storage({ [pharmacyKey]: JSON.stringify(customVY) })).map.VY, customVY.VY);
});

test('already-correct Peter with old KAM team joins East without changing his name', () => {
  const saved = copy(oldPharmacy);
  saved.VY = { login: 'p.papcun', meno: 'Peter vlastné meno', team: 'KAM' };
  assert.deepEqual(load(pharmacyPath, storage({ [pharmacyKey]: JSON.stringify(saved) })).map.VY,
    { login: 'p.papcun', meno: 'Peter vlastné meno', team: 'east' });
});

test('subsequent manual edits are never migrated again and backup is immutable', () => {
  for (const [file, key, oldMap] of [[pharmacyPath, pharmacyKey, oldPharmacy], [salesPath, salesKey, oldSales]]) {
    const store = storage({ [key]: JSON.stringify(oldMap) });
    load(file, store);
    const backup = store.getItem(key + backupSuffix);
    store.setItem(key, JSON.stringify(oldMap)); // Intentional manual restoration after migration.
    assert.deepEqual(load(file, store).map, oldMap);
    assert.equal(store.getItem(key + backupSuffix), backup);
  }
});

test('manual edits made on a fresh installation are preserved after restart', () => {
  const pharmacy = storage();
  const edited = load(pharmacyPath, pharmacy,
    "REGION_REP.BA.team = 'KAM'; REGION_REP.VY = { login: 'l.faber', meno: 'Lenka Fáber', team: 'KAM' }; repMapSave();");
  assert.deepEqual(load(pharmacyPath, pharmacy).map, edited.map);
  const sales = storage();
  const editedSales = load(salesPath, sales, "REP_MAP.VY = 'l.faber'; repMapSave();");
  assert.deepEqual(load(salesPath, sales).map, editedSales.map);
});

test('legacy sales map is backed up without altering its source or corrections', () => {
  const original = JSON.stringify({ ...oldSales, BA: 'custom.ba' });
  const store = storage({ [legacyKey]: original, reagila_predaje_korekcie: 'historical corrections l.faber' });
  assert.deepEqual(load(salesPath, store).map, { ...expectedSales, BA: 'custom.ba' });
  assert.equal(store.getItem(legacyKey), original);
  assert.equal(store.getItem(legacyKey + backupSuffix), original);
  assert.equal(store.getItem(salesKey + migrationSuffix), '1');
  assert.equal(store.getItem('reagila_predaje_korekcie'), 'historical corrections l.faber');
});

test('interrupted migration replays safely and keeps the first backup', () => {
  for (const [file, key, oldMap, expected] of [
    [pharmacyPath, pharmacyKey, oldPharmacy, expectedPharmacy],
    [salesPath, salesKey, oldSales, expectedSales]
  ]) {
    const original = JSON.stringify(oldMap);
    const store = storage({ [key]: JSON.stringify(expected), [key + backupSuffix]: original });
    assert.deepEqual(load(file, store).map, expected);
    assert.equal(store.getItem(key + backupSuffix), original);
    assert.equal(store.getItem(key + migrationSuffix), '1');
  }
});

test('missing/unavailable/malformed storage uses defaults without throwing', () => {
  for (const [file, key, expected] of [[pharmacyPath, pharmacyKey, expectedPharmacy], [salesPath, salesKey, expectedSales]]) {
    assert.deepEqual(load(file).map, expected);
    assert.deepEqual(load(file, storage({}, 'unavailable')).map, expected);
    assert.deepEqual(load(file, storage({ [key]: '{invalid' })).map, expected);
  }
});

test('backup write failure preserves the existing custom map', () => {
  const saved = copy(oldPharmacy);
  saved.BA.meno = 'Custom';
  assert.deepEqual(load(pharmacyPath, storage({ [pharmacyKey]: JSON.stringify(saved) }, 'readOnly')).map, saved);
  const sales = { ...oldSales, BA: 'custom.ba' };
  assert.deepEqual(load(salesPath, storage({ [salesKey]: JSON.stringify(sales) }, 'readOnly')).map, sales);
});

console.log('Reagila converter tests: ' + passed + ' passed, ' + failed + ' failed (private files verified).');
if (failed) process.exitCode = 1;
