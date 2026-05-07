// ═══════════════════════════════════════════════════════════════════════════
// Satori — Gynekologická línia — Apps Script backend
// Samostatný skript pre Gyn Google Sheet (oddelený od GP línie)
// ═══════════════════════════════════════════════════════════════════════════

// Token musí sedieť s GYN_API_TOKEN konštantou v index.html
// Ulož aj do Script Properties (Projekt → Script properties → GYN_API_TOKEN)
var API_TOKEN = PropertiesService.getScriptProperties().getProperty('GYN_API_TOKEN') || 'gr-gyn-2026';

function requireToken(e) {
  return (e.parameter.token || '') === API_TOKEN;
}

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActive();
    var action = e.parameter.action || '';

    // ── PRIHLÁSENIE ──
    if (action === 'login') {
      var username = (e.parameter.username || '').trim().toLowerCase();
      var password = e.parameter.password || '';
      var sheet = ss.getSheetByName('Pouzivatelia');
      if (!sheet) return jsonResp({ok: false});
      var rows = sheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        var rowLogin = String(rows[i][0] || '').trim().toLowerCase();
        var rowHeslo = String(rows[i][1] || '');
        if (rowLogin === username && rowHeslo === password) {
          return jsonResp({
            ok:     true,
            line:   'gyn',
            name:   String(rows[i][2] || '').trim(),
            role:   String(rows[i][3] || '').trim().toLowerCase(),
            linia:  String(rows[i][4] || '').trim().toLowerCase(),
            region: String(rows[i][5] || '').trim().toUpperCase()
          });
        }
      }
      return jsonResp({ok: false});
    }

    // ── PING LOGIN — aktualizuje posledný prístup ──
    if (action === 'pingLogin') {
      var rep = (e.parameter.reprezentant || '').trim().toLowerCase();
      if (!rep) return jsonResp({ok: false});
      var sheet = ss.getSheetByName('Pouzivatelia');
      if (!sheet) return jsonResp({ok: false});
      var rows = sheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (String(rows[i][0] || '').trim().toLowerCase() === rep) {
          // col G (index 6) = posledny_login (dátum + čas)
          var cell = sheet.getRange(i + 1, 7);
          cell.setValue(new Date());
          cell.setNumberFormat('dd.MM.yyyy HH:mm:ss');
          return jsonResp({ok: true});
        }
      }
      return jsonResp({ok: false});
    }

    // ── ZOZNAM REPREZENTANTOV ──
    if (action === 'getRepList') {
      if (!requireToken(e)) return jsonResp({ok: false, error: 'Unauthorized'});
      var sheet = ss.getSheetByName('Pouzivatelia');
      if (!sheet) return jsonResp({ok: false, error: 'Sheet Pouzivatelia nenajdeny'});
      var rows = sheet.getDataRange().getValues();
      var reps = [];
      for (var i = 1; i < rows.length; i++) {
        var login  = String(rows[i][0] || '').trim();
        var meno   = String(rows[i][2] || '').trim();
        var rola   = String(rows[i][3] || '').trim().toLowerCase();
        var linia  = String(rows[i][4] || '').trim().toLowerCase();
        var region = String(rows[i][5] || '').trim().toUpperCase();
        if (!login || !meno) continue;
        if (rola === 'gyn-rep') {
          reps.push({login: login, meno: meno, rola: rola, linia: linia, region: region});
        }
      }
      return jsonResp({ok: true, reps: reps});
    }

    // ── PLNENIE PRE VŠETKÝCH REPOV ──
    // URL: ?action=getPlnenieAll&rok=2026&Q=2&token=xxx
    if (action === 'getPlnenieAll') {
      if (!requireToken(e)) return jsonResp({ok: false, error: 'Unauthorized'});
      var rokA    = parseInt(e.parameter.rok) || 2026;
      var qA      = parseInt(e.parameter.Q)   || 1;
      var qMonths = {1:[1,2,3], 2:[4,5,6], 3:[7,8,9], 4:[10,11,12]}[qA] || [];

      // PLAN — záložka "Plan"
      // Stĺpce: login | meno | region | rok | Q | Produkt1 | Produkt2 | ...
      var planSheet  = ss.getSheetByName('Plan');
      var planByRep  = {};
      var planProds  = [];
      if (planSheet) {
        var planData = planSheet.getDataRange().getValues();
        if (planData.length >= 2) {
          var planHdr = planData[0].map(function(h){ return String(h || '').trim(); });
          for (var j = 5; j < planHdr.length; j++) {
            if (planHdr[j]) planProds.push(planHdr[j]);
          }
          for (var i = 1; i < planData.length; i++) {
            var pr = planData[i];
            var repKey = String(pr[0] || '').trim().toLowerCase();
            if (!repKey) continue;
            if (parseInt(pr[3]) !== rokA) continue;
            if (parseInt(pr[4]) !== qA)   continue;
            if (!planByRep[repKey]) planByRep[repKey] = {};
            for (var k = 5; k < planHdr.length; k++) {
              var prodKey = normalizeProd(planHdr[k]);
              if (!prodKey) continue;
              planByRep[repKey][prodKey] = parseNum(pr[k]);
            }
          }
        }
      }

      // PREDAJE — záložka "Predaje"
      // Stĺpce: login | meno | rok | mesiac | Produkt1 | Produkt2 | ...
      var predajeSheet  = ss.getSheetByName('Predaje');
      var predajeByRep  = {};
      var predajeProds  = [];
      if (predajeSheet) {
        var prData = predajeSheet.getDataRange().getValues();
        if (prData.length >= 2) {
          var prHdr = prData[0].map(function(h){ return String(h || '').trim(); });
          for (var j = 4; j < prHdr.length; j++) {
            if (prHdr[j]) predajeProds.push(prHdr[j]);
          }
          for (var i = 1; i < prData.length; i++) {
            var row     = prData[i];
            var repKey2 = String(row[0] || '').trim().toLowerCase();
            if (!repKey2) continue;
            if (parseInt(row[2]) !== rokA) continue;
            var mes = parseInt(row[3]);
            if (qMonths.indexOf(mes) === -1) continue;
            if (!predajeByRep[repKey2]) predajeByRep[repKey2] = {total: {}, byMonth: {}};
            if (!predajeByRep[repKey2].byMonth[mes]) predajeByRep[repKey2].byMonth[mes] = {};
            for (var k = 4; k < prHdr.length; k++) {
              var pk = normalizeProd(prHdr[k]);
              if (!pk) continue;
              var val = parseNum(row[k]);
              predajeByRep[repKey2].byMonth[mes][pk] = val;
              predajeByRep[repKey2].total[pk] = (predajeByRep[repKey2].total[pk] || 0) + val;
            }
          }
        }
      }

      return jsonResp({
        ok:              true,
        rok:             rokA,
        Q:               qA,
        plan:            planByRep,
        predaje:         predajeByRep,
        planProducts:    planProds,
        predajeProducts: predajeProds
      });
    }

    // ── GET CONFIG ──
    if (action === 'getConfig') {
      if (!requireToken(e)) return jsonResp({ok: false, error: 'Unauthorized'});
      var key = (e.parameter.key || '').trim();
      if (!key) return jsonResp({ok: false, error: 'missing key'});
      var cfg = ss.getSheetByName('Config');
      if (!cfg) return jsonResp({ok: true, value: null});
      var rows = cfg.getDataRange().getValues();
      for (var i = 0; i < rows.length; i++) {
        if (String(rows[i][0] || '').trim() === key) {
          var v = rows[i][1];
          return jsonResp({ok: true, value: (v === '' || v == null) ? null : String(v)});
        }
      }
      return jsonResp({ok: true, value: null});
    }

    // ── SET CONFIG ──
    if (action === 'setConfig') {
      if (!requireToken(e)) return jsonResp({ok: false, error: 'Unauthorized'});
      var key   = (e.parameter.key   || '').trim();
      var value = e.parameter.value;
      if (!key) return jsonResp({ok: false, error: 'missing key'});
      var cfg = ss.getSheetByName('Config');
      if (!cfg) {
        cfg = ss.insertSheet('Config');
        cfg.getRange(1, 1).setValue('key');
        cfg.getRange(1, 2).setValue('value');
      }
      var rows = cfg.getDataRange().getValues();
      for (var i = 0; i < rows.length; i++) {
        if (String(rows[i][0] || '').trim() === key) {
          cfg.getRange(i + 1, 2).setValue(value);
          return jsonResp({ok: true});
        }
      }
      cfg.appendRow([key, value]);
      return jsonResp({ok: true});
    }

    // ── SATORI VOTE ──
    if (action === 'satoriVote') {
      var rep   = (e.parameter.username || '').trim();
      var vote  = (e.parameter.vote     || '').trim();
      if (!rep || (vote !== 'up' && vote !== 'down')) return jsonResp({ok: false});
      var tab = ss.getSheetByName('SatoriVotes');
      if (!tab) {
        tab = ss.insertSheet('SatoriVotes');
        tab.getRange(1, 1, 1, 3).setValues([['login', 'hlas', 'datum']]);
      }
      tab.appendRow([rep, vote, new Date()]);
      return jsonResp({ok: true});
    }

    // ─────────────────────────────────────────────────────────
    // BUDÚCE ENDPOINTY (fáza 2 — návštevy gynekológov)
    // ─────────────────────────────────────────────────────────
    // save          — uloženie záznamu návštevy
    // getHistory    — história návštev jedného reprezentanta
    // getAllHistory  — historia pre všetkých (manažérsky pohľad)
    // saveNote      — aktualizácia poznámky k záznamu

    return jsonResp({error: 'unknown action'});

  } catch (err) {
    return ContentService.createTextOutput('ERR:' + err.message)
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

function jsonResp(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function normalizeProd(name) {
  if (!name) return '';
  return String(name).trim().toLowerCase();
}

function parseNum(v) {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  if (v instanceof Date) return 0;
  var s = String(v).trim()
    .replace(/[\s  ']/g, '');
  if (s.indexOf(',') !== -1 && s.indexOf('.') !== -1) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.indexOf(',') !== -1) {
    s = s.replace(',', '.');
  }
  s = s.replace(/[^\d.\-]/g, '');
  var n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}
