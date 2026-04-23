var SHEET_ID = '1V_-iRUpOM_rBk42iwiuvRJEt00rQHC4sxMB4auEQAFc';

function doGet(e) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var action = e.parameter.action || 'save';

    // ── PRIHLÁSENIE ──
    if(action === 'login') {
      var username = (e.parameter.username || '').trim().toLowerCase();
      var password = e.parameter.password || '';
      var sheet = ss.getSheetByName('Pouzivatelia');
      if(!sheet) return jsonResponse({ok: false});
      var rows = sheet.getDataRange().getValues();
      for(var i = 1; i < rows.length; i++) {
        if((rows[i][0]||'').trim().toLowerCase() === username && (rows[i][1]||'') === password) {
          return jsonResponse({ok: true, name: rows[i][2]||'', role: rows[i][3]||'rep', region: rows[i][4]||''});
        }
      }
      return jsonResponse({ok: false});
    }

    // ── ULOŽENIE ZÁZNAMU ──
    if(action === 'save') {
      var sheet = ss.getSheets()[0];
      var p = e.parameter;
      function num(v){ var n = parseFloat(v); return isNaN(n) ? 0 : n; }
      sheet.appendRow([
        p.reprezentant||'', p.datum||'', p.cas||'',
        p.region||'', p.okres||'', p.lekar||'',
        p.kategoria||'', num(p.kapitacia),
        num(p.aflamil_n), num(p.aflamil_eur),
        num(p.suprax_n),  num(p.suprax_eur),
        num(p.vidonorm_n), num(p.vidonorm_eur),
        num(p.cavinton_n), num(p.cavinton_eur),
        num(p.rocny_potential), p.odporucanie||'', p.scenar||'',
        p.poznamka||''
      ]);
      return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
    }

    // ── VŠETKY HISTÓRIE NARAZ (pre manažérsky dashboard) ──
    if(action === 'getAllHistory') {
      var sheet = ss.getSheets()[0];
      var rows = sheet.getDataRange().getValues();
      if(rows.length < 2) return jsonResponse({});
      var headers = rows[0].map(function(h){ return String(h||'').trim().toLowerCase().replace(/\s+/g,'_'); });
      var repIdx = headers.indexOf('reprezentant');
      if(repIdx === -1) return jsonResponse({});
      var numericCols = ['kapitacia','aflamil_n','aflamil_eur','suprax_n','suprax_eur',
                         'vidonorm_n','vidonorm_eur','cavinton_n','cavinton_eur','rocny_potential'];
      var epoch = new Date(1899, 11, 30);
      var result = {};
      for(var i = 1; i < rows.length; i++){
        var row = rows[i];
        var rep = String(row[repIdx]||'').trim().toLowerCase();
        if(!rep) continue;
        if(!result[rep]) result[rep] = [];
        var obj = { row: i + 1 };
        headers.forEach(function(h, idx){
          if(!h) return;
          var v = row[idx];
          if(v instanceof Date){
            obj[h] = numericCols.indexOf(h) !== -1
              ? Math.max(0, Math.round((v.getTime() - epoch.getTime()) / 86400000))
              : v.toISOString();
          } else { obj[h] = v; }
        });
        result[rep].push(obj);
      }
      return jsonResponse(result);
    }

    // ── NAČÍTANIE HISTÓRIE ──
    if(action === 'getHistory') {
      var reprezentant = e.parameter.reprezentant || '';
      var sheet = ss.getSheets()[0];
      var rows = sheet.getDataRange().getValues();
      if(rows.length < 2) return jsonResponse([]);

      var headers = rows[0].map(function(h){ return String(h||'').trim().toLowerCase(); });
      var repIdx = headers.indexOf('reprezentant');

      var result = [];
      for(var i = 1; i < rows.length; i++) {
        var row = rows[i];
        var rep = String(row[repIdx]||'').trim();
        if(rep !== reprezentant) continue;

        var obj = { row: i + 1 };
        var numericCols = ['kapitacia','aflamil_n','aflamil_eur','suprax_n','suprax_eur',
                           'vidonorm_n','vidonorm_eur','cavinton_n','cavinton_eur','rocny_potential'];
        var epoch = new Date(1899, 11, 30);
        headers.forEach(function(h, idx){
          if(!h) return;
          var v = row[idx];
          if(v instanceof Date) {
            if(numericCols.indexOf(h) !== -1){
              var days = Math.round((v.getTime() - epoch.getTime()) / 86400000);
              obj[h] = days > 0 ? days : 0;
            } else {
              obj[h] = v.toISOString();
            }
          } else {
            obj[h] = v;
          }
        });
        result.push(obj);
      }
      return jsonResponse(result);
    }

    // ── AKTUALIZÁCIA POZNÁMKY ──
    if(action === 'saveNote') {
      var p = e.parameter;
      var sheet = ss.getSheets()[0];
      var rowNum = parseInt(p.row);
      if(rowNum > 0) {
        var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        var poznIdx = -1;
        for(var j = 0; j < headers.length; j++) {
          if(String(headers[j]||'').trim().toLowerCase() === 'poznamka') { poznIdx = j + 1; break; }
        }
        if(poznIdx > 0) sheet.getRange(rowNum, poznIdx).setValue(p.poznamka || '');
      }
      return jsonResponse({ok: true});
    }

    // ── ZOZNAM MANAŽÉROV (pre admin view) ──
    if(action === 'getManagers') {
      var sheet = ss.getSheetByName('Pouzivatelia');
      if(!sheet) return jsonResponse([]);
      var rows = sheet.getDataRange().getValues();
      var headers = rows[0].map(function(h){ return String(h||'').trim().toLowerCase(); });
      var loginIdx = headers.indexOf('login');
      if(loginIdx === -1) loginIdx = headers.indexOf('username');
      var nameIdx = headers.indexOf('meno');
      if(nameIdx === -1) nameIdx = headers.indexOf('name');
      var roleIdx = headers.indexOf('rola');
      if(roleIdx === -1) roleIdx = headers.indexOf('role');
      var lastIdx = headers.indexOf('posledny_login');
      var result = [];
      var repRoles = ['rep west', 'rep east', 'rep'];
      for(var i = 1; i < rows.length; i++){
        var role = String(rows[i][roleIdx]||'').toLowerCase().trim();
        if(repRoles.indexOf(role) !== -1) continue;
        var u = String(rows[i][loginIdx]||'').trim().toLowerCase();
        if(!u) continue;
        var v = lastIdx !== -1 ? rows[i][lastIdx] : null;
        result.push({
          username: u,
          name: String(rows[i][nameIdx]||'').trim(),
          role: String(rows[i][roleIdx]||'').trim(),
          posledny_login: v instanceof Date ? v.toISOString() : (v ? String(v) : '')
        });
      }
      return jsonResponse(result);
    }

    // ── PING LOGIN — zapíše posledný prístup ──
    if(action === 'pingLogin') {
      var rep = (e.parameter.reprezentant || '').trim().toLowerCase();
      if(!rep) return jsonResponse({ok: false});
      var sheet = ss.getSheetByName('Pouzivatelia');
      if(!sheet) return jsonResponse({ok: false});
      var rows = sheet.getDataRange().getValues();
      var headers = rows[0].map(function(h){ return String(h||'').trim().toLowerCase(); });
      var usernameIdx = headers.indexOf('login');
      if(usernameIdx === -1) usernameIdx = headers.indexOf('username');
      var loginIdx = headers.indexOf('posledny_login');
      if(usernameIdx === -1 || loginIdx === -1) return jsonResponse({ok: false});
      for(var i = 1; i < rows.length; i++){
        if(String(rows[i][usernameIdx]||'').trim().toLowerCase() === rep){
          sheet.getRange(i + 1, loginIdx + 1).setValue(new Date());
          return jsonResponse({ok: true});
        }
      }
      return jsonResponse({ok: false});
    }

    // ── POSLEDNÉ PRIHLÁSENIA — vráti timestamp per rep ──
    if(action === 'getLastLogins') {
      var sheet = ss.getSheetByName('Pouzivatelia');
      if(!sheet) return jsonResponse({});
      var rows = sheet.getDataRange().getValues();
      var headers = rows[0].map(function(h){ return String(h||'').trim().toLowerCase(); });
      var usernameIdx = headers.indexOf('login');
      if(usernameIdx === -1) usernameIdx = headers.indexOf('username');
      var loginIdx = headers.indexOf('posledny_login');
      if(usernameIdx === -1 || loginIdx === -1) return jsonResponse({});
      var result = {};
      for(var i = 1; i < rows.length; i++){
        var u = String(rows[i][usernameIdx]||'').trim().toLowerCase();
        var v = rows[i][loginIdx];
        if(u && v){
          result[u] = v instanceof Date ? v.toISOString() : String(v);
        }
      }
      return jsonResponse(result);
    }

    // ── ZOZNAM REPOV PODĽA REGIONU (pre AM West/East) ──
    if(action === 'getReps') {
      var region = (e.parameter.region || '').toLowerCase().trim();
      var sheet = ss.getSheetByName('Pouzivatelia');
      if(!sheet) return jsonResponse([]);
      var rows = sheet.getDataRange().getValues();
      var result = [];
      for(var i = 1; i < rows.length; i++) {
        var username = String(rows[i][0]||'').trim().toLowerCase();
        var role = String(rows[i][3]||'').toLowerCase().trim();
        if(role === 'rep ' + region && username) {
          result.push(username);
        }
      }
      return jsonResponse(result);
    }

    // ── ZOZNAM VŠETKÝCH REPREZENTANTOV (pre dynamické načítanie v appke) ──
    if(action === 'getRepList') {
      var sheet = ss.getSheetByName('Pouzivatelia');
      if(!sheet) return jsonResponse({ok: false, error: 'Sheet Pouzivatelia nenajdeny'});
      var rows = sheet.getDataRange().getValues();
      var reps = [];
      for(var i = 1; i < rows.length; i++) {
        var login  = String(rows[i][0] || '').trim();
        var meno   = String(rows[i][2] || '').trim();
        var rola   = String(rows[i][3] || '').trim().toLowerCase();
        var region = String(rows[i][4] || '').trim();
        if(!login || !meno) continue;
        if(rola === 'rep west' || rola === 'rep east') {
          reps.push({ login: login, meno: meno, rola: rola, region: region });
        }
      }
      return jsonResponse({ok: true, reps: reps});
    }

    // ═══════════════════════════════════════════════════════════════════
    // PLNENIE ENDPOINTS — case-insensitive matching produktov
    // ═══════════════════════════════════════════════════════════════════

    // ── PLNENIE PRE JEDNÉHO REPA ──
    // URL: ?action=getPlnenie&reprezentant=z.lapsan&rok=2026&Q=1
    if(action === 'getPlnenie') {
      var rep = (e.parameter.reprezentant || '').trim().toLowerCase();
      var rok = parseInt(e.parameter.rok) || 2026;
      var q = parseInt(e.parameter.Q) || 1;
      if(!rep) return jsonResponse({ok: false, error: 'missing reprezentant'});

      var plnResult = buildPlnenieForRep(ss, rep, rok, q);
      return jsonResponse({
        ok: true,
        reprezentant: rep,
        rok: rok,
        Q: q,
        plan: plnResult.plan,
        predaje: plnResult.predaje,
        produkty: plnResult.produkty
      });
    }

    // ── PLNENIE PRE VŠETKÝCH REPOV (admin pohľad) ──
    // URL: ?action=getPlnenieAll&rok=2026&Q=1
    // Q1 → záložka "Predaje", Q2–Q4 → záložka "Predaje_2"
    if(action === 'getPlnenieAll') {
      var rokA = parseInt(e.parameter.rok) || 2026;
      var qA = parseInt(e.parameter.Q) || 1;
      var qMonthsA = { 1:[1,2,3], 2:[4,5,6], 3:[7,8,9], 4:[10,11,12] }[qA] || [];

      // PLAN: načítaj hlavičku a všetkých repov
      var planSheet = ss.getSheetByName('Plan');
      var planByRep = {};
      var planProducts = [];
      if(planSheet) {
        var planRows = planSheet.getDataRange().getValues();
        if(planRows.length >= 2) {
          var planHdr = planRows[0].map(function(h){ return String(h||'').trim(); });
          for(var j = 4; j < planHdr.length; j++) {
            if(planHdr[j]) planProducts.push(planHdr[j]);
          }
          for(var i = 1; i < planRows.length; i++) {
            var pr = planRows[i];
            var repA = String(pr[0]||'').trim().toLowerCase();
            if(!repA) continue;
            if(parseInt(pr[2]) !== rokA) continue;
            if(parseInt(pr[3]) !== qA) continue;
            if(!planByRep[repA]) planByRep[repA] = {};
            for(var k = 4; k < planHdr.length; k++) {
              var prodKey = normalizeProd(planHdr[k]);
              if(!prodKey) continue;
              planByRep[repA][prodKey] = parseNum(pr[k]);
            }
          }
        }
      }

      // PREDAJE: Q1 → "Predaje", Q2–Q4 → "Predaje_2"
      var predajeSheetName = (qA === 1) ? 'Predaje' : 'Predaje_2';
      var predajeSheet = ss.getSheetByName(predajeSheetName);
      var predajeByRep = {};
      var predajeProducts = [];
      if(predajeSheet) {
        var prRows = predajeSheet.getDataRange().getValues();
        if(prRows.length >= 2) {
          var prHdr = prRows[0].map(function(h){ return String(h||'').trim(); });
          for(var j = 4; j < prHdr.length; j++) {
            if(prHdr[j]) predajeProducts.push(prHdr[j]);
          }
          for(var i = 1; i < prRows.length; i++) {
            var row = prRows[i];
            var repA2 = String(row[0]||'').trim().toLowerCase();
            if(!repA2) continue;
            if(parseInt(row[2]) !== rokA) continue;
            var mes = parseInt(row[3]);
            if(qMonthsA.indexOf(mes) === -1) continue;
            if(!predajeByRep[repA2]) predajeByRep[repA2] = { total: {}, byMonth: {} };
            if(!predajeByRep[repA2].byMonth[mes]) predajeByRep[repA2].byMonth[mes] = {};
            for(var k = 4; k < prHdr.length; k++) {
              var prodKey2 = normalizeProd(prHdr[k]);
              if(!prodKey2) continue;
              var val2 = parseNum(row[k]);
              predajeByRep[repA2].byMonth[mes][prodKey2] = val2;
              predajeByRep[repA2].total[prodKey2] = (predajeByRep[repA2].total[prodKey2] || 0) + val2;
            }
          }
        }
      }

      return jsonResponse({
        ok: true,
        rok: rokA,
        Q: qA,
        plan: planByRep,
        predaje: predajeByRep,
        planProducts: planProducts,
        predajeProducts: predajeProducts
      });
    }

    // ── PHARMA MS DÁTA ──
    // URL: ?action=getPharmaData&oblast=KE   (mesiac voliteľný — default = najnovší)
    if(action === 'getPharmaData') {
      var oblast = (e.parameter.oblast || '').trim().toUpperCase();
      if(!oblast) return jsonResponse({ok: false, error: 'missing oblast'});

      var sheet = ss.getSheetByName('PharmaData');
      if(!sheet) return jsonResponse({ok: false, error: 'Sheet PharmaData nenajdeny'});

      var rows = sheet.getDataRange().getValues();
      if(rows.length < 2) return jsonResponse({ok: true, mesiac: '', rows: []});

      var hdr = rows[0].map(function(h){ return String(h||'').trim().toLowerCase(); });
      var iMesiac = hdr.indexOf('mesiac');
      var iProdukt = hdr.indexOf('produkt_kod');
      var iOblast  = hdr.indexOf('oblast');
      var iOkres   = hdr.indexOf('okres');
      var iNasMs   = hdr.indexOf('nas_ms');
      var iK1n = hdr.indexOf('k1_nazov'), iK1ms = hdr.indexOf('k1_ms');
      var iK2n = hdr.indexOf('k2_nazov'), iK2ms = hdr.indexOf('k2_ms');
      var iK3n = hdr.indexOf('k3_nazov'), iK3ms = hdr.indexOf('k3_ms');

      // Najdi najnovší mesiac pre daný región
      var mesiacParam = (e.parameter.mesiac || '').trim();
      if(!mesiacParam) {
        var mesiace = [];
        for(var i = 1; i < rows.length; i++){
          var m = String(rows[i][iMesiac]||'').trim();
          if(m && mesiace.indexOf(m) < 0) mesiace.push(m);
        }
        mesiace.sort();
        mesiacParam = mesiace[mesiace.length - 1] || '';
      }

      var result = [];
      for(var i = 1; i < rows.length; i++){
        var r = rows[i];
        if(String(r[iMesiac]).trim() !== mesiacParam) continue;
        if(String(r[iOblast]).trim().toUpperCase() !== oblast) continue;
        var nasMs = parseFloat(r[iNasMs]) || 0;
        result.push({
          produkt: String(r[iProdukt]||'').trim(),
          okres:   String(r[iOkres]||'').trim(),
          nas_ms:  nasMs,
          k1: { n: String(r[iK1n]||'').trim(), ms: parseFloat(r[iK1ms])||0 },
          k2: { n: String(r[iK2n]||'').trim(), ms: parseFloat(r[iK2ms])||0 },
          k3: { n: String(r[iK3n]||'').trim(), ms: parseFloat(r[iK3ms])||0 }
        });
      }
      return jsonResponse({ok: true, mesiac: mesiacParam, rows: result});
    }

    return jsonResponse({error: 'unknown action'});

  } catch(err) {
    return ContentService.createTextOutput('ERR:'+err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}

// Helper: normalizuje názov produktu pre case-insensitive porovnávanie
function normalizeProd(name) {
  if(!name) return '';
  return String(name).trim().toLowerCase();
}

// Helper: robustné parsovanie čísla z Sheet bunky.
function parseNum(v) {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  if (v instanceof Date) return 0;
  var s = String(v).trim();
  if (!s) return 0;
  s = s.replace(/[\s\u00A0\u202F']/g, '');
  if (s.indexOf(',') !== -1 && s.indexOf('.') !== -1) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.indexOf(',') !== -1) {
    s = s.replace(',', '.');
  }
  s = s.replace(/[^\d.\-]/g, '');
  var n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

// Helper: zostaví plán + predaje pre jedného repa a konkrétny Q
// Q1 → záložka "Predaje", Q2–Q4 → záložka "Predaje_2"
function buildPlnenieForRep(ss, rep, rok, q) {
  var qMonths = { 1:[1,2,3], 2:[4,5,6], 3:[7,8,9], 4:[10,11,12] }[q] || [];

  // Plan
  var plan = {};
  var planProducts = [];
  var planSheet = ss.getSheetByName('Plan');
  if(planSheet) {
    var planRows = planSheet.getDataRange().getValues();
    if(planRows.length >= 2) {
      var planHdr = planRows[0].map(function(h){ return String(h||'').trim(); });
      for(var j = 4; j < planHdr.length; j++) {
        if(planHdr[j]) planProducts.push(planHdr[j]);
      }
      for(var i = 1; i < planRows.length; i++) {
        var pr = planRows[i];
        if(String(pr[0]||'').trim().toLowerCase() !== rep) continue;
        if(parseInt(pr[2]) !== rok) continue;
        if(parseInt(pr[3]) !== q) continue;
        for(var k = 4; k < planHdr.length; k++) {
          var prodKey = normalizeProd(planHdr[k]);
          if(!prodKey) continue;
          plan[prodKey] = parseNum(pr[k]);
        }
        break;
      }
    }
  }

  // Predaje: Q1 → "Predaje", Q2–Q4 → "Predaje_2"
  var predaje = { total: {}, byMonth: {} };
  var predajeProducts = [];
  var predajeSheetName = (q === 1) ? 'Predaje' : 'Predaje_2';
  var predajeSheet = ss.getSheetByName(predajeSheetName);
  if(predajeSheet) {
    var prRows = predajeSheet.getDataRange().getValues();
    if(prRows.length >= 2) {
      var prHdr = prRows[0].map(function(h){ return String(h||'').trim(); });
      for(var j = 4; j < prHdr.length; j++) {
        if(prHdr[j]) predajeProducts.push(prHdr[j]);
      }
      for(var i = 1; i < prRows.length; i++) {
        var row = prRows[i];
        if(String(row[0]||'').trim().toLowerCase() !== rep) continue;
        if(parseInt(row[2]) !== rok) continue;
        var mes = parseInt(row[3]);
        if(qMonths.indexOf(mes) === -1) continue;
        if(!predaje.byMonth[mes]) predaje.byMonth[mes] = {};
        for(var k = 4; k < prHdr.length; k++) {
          var prodKey2 = normalizeProd(prHdr[k]);
          if(!prodKey2) continue;
          var val2 = parseNum(row[k]);
          predaje.byMonth[mes][prodKey2] = val2;
          predaje.total[prodKey2] = (predaje.total[prodKey2] || 0) + val2;
        }
      }
    }
  }

  return {
    plan: plan,
    predaje: predaje,
    produkty: { plan: planProducts, predaje: predajeProducts }
  };
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── JEDNORAZOVÁ OPRAVA starých Date-buniek ──
function fixBrokenColumns() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheets()[0];
  var lastRow = sheet.getLastRow();
  if(lastRow < 2) return;

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var targetCols = ['suprax_eur', 'rocny_potential', 'aflamil_eur', 'vidonorm_eur', 'cavinton_eur',
                    'suprax_n', 'aflamil_n', 'vidonorm_n', 'cavinton_n', 'kapitacia'];
  var colIndexes = [];
  for(var i = 0; i < headers.length; i++){
    var h = String(headers[i]||'').trim().toLowerCase();
    if(targetCols.indexOf(h) !== -1) colIndexes.push({ col: i + 1, name: h });
  }

  var epoch = new Date(1899, 11, 30);

  var fixed = 0;
  colIndexes.forEach(function(ci){
    var range = sheet.getRange(2, ci.col, lastRow - 1, 1);
    var values = range.getValues();
    for(var r = 0; r < values.length; r++){
      var v = values[r][0];
      if(v instanceof Date){
        var days = Math.round((v.getTime() - epoch.getTime()) / 86400000);
        values[r][0] = days > 0 ? days : 0;
        fixed++;
      } else if(typeof v === 'string' && v.trim() !== ''){
        if(v.indexOf('T') !== -1){
          var d = new Date(v);
          if(!isNaN(d.getTime())){
            var days2 = Math.round((d.getTime() - epoch.getTime()) / 86400000);
            values[r][0] = days2 > 0 ? days2 : 0;
            fixed++;
            continue;
          }
        }
        var num = Number(v.replace(/,/g,'.').replace(/[^0-9.\-]/g,''));
        if(!isNaN(num)){ values[r][0] = num; fixed++; }
      }
    }
    range.setValues(values);
    range.setNumberFormat('0.##');
  });

  Logger.log('Opravených buniek: ' + fixed);
  return 'OK, opravených: ' + fixed;
}
