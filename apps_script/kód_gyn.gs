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
      // Header-based detekcia pre pohlavie + avatar (rovnaký pattern ako Golem)
      var loginHeader = rows[0] || [];
      var loginPohlavieIdx = -1, loginAvatarIdx = -1;
      for (var lhi = 0; lhi < loginHeader.length; lhi++) {
        var lh = String(loginHeader[lhi] || '').trim().toLowerCase();
        if (lh === 'pohlavie' || lh === 'gender') loginPohlavieIdx = lhi;
        if (lh === 'avatar') loginAvatarIdx = lhi;
      }
      for (var i = 1; i < rows.length; i++) {
        var rowLogin = String(rows[i][0] || '').trim().toLowerCase();
        var rowHeslo = String(rows[i][1] || '');
        if (rowLogin === username && rowHeslo === password) {
          return jsonResp({
            ok:       true,
            line:     'gyn',
            name:     String(rows[i][2] || '').trim(),
            role:     String(rows[i][3] || '').trim().toLowerCase(),
            linia:    String(rows[i][4] || '').trim().toLowerCase(),
            region:   String(rows[i][5] || '').trim().toUpperCase(),
            pohlavie: loginPohlavieIdx >= 0 ? String(rows[i][loginPohlavieIdx] || '').trim() : '',
            avatar:   loginAvatarIdx   >= 0 ? String(rows[i][loginAvatarIdx]   || '').trim() : ''
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
      // Najdi stĺpce pohlavie + avatar v hlavičke (case-insensitive)
      var header = rows[0] || [];
      var pohlavieIdx = -1, avatarIdx = -1;
      for (var hi = 0; hi < header.length; hi++) {
        var h = String(header[hi] || '').trim().toLowerCase();
        if (h === 'pohlavie' || h === 'gender') pohlavieIdx = hi;
        if (h === 'avatar') avatarIdx = hi;
      }
      var reps = [];
      for (var i = 1; i < rows.length; i++) {
        var login  = String(rows[i][0] || '').trim();
        var meno   = String(rows[i][2] || '').trim();
        var rola   = String(rows[i][3] || '').trim().toLowerCase();
        var linia  = String(rows[i][4] || '').trim().toLowerCase();
        var region = String(rows[i][5] || '').trim().toUpperCase();
        var pohlavie = (pohlavieIdx >= 0) ? String(rows[i][pohlavieIdx] || '').trim() : '';
        var avatar   = (avatarIdx   >= 0) ? String(rows[i][avatarIdx]   || '').trim() : '';
        if (!login || !meno) continue;
        if (rola === 'gyn-rep') {
          reps.push({login: login, meno: meno, rola: rola, linia: linia, region: region, pohlavie: pohlavie, avatar: avatar});
        }
      }
      return jsonResp({ok: true, reps: reps});
    }

    // ── ULOŽENIE AVATAR CONFIGU ──
    // URL: ?action=setAvatar&username=b.sivakova&config=<JSON>&token=...
    if (action === 'setAvatar') {
      if (!requireToken(e)) return jsonResp({ok: false, error: 'Unauthorized'});
      var avUser = (e.parameter.username || '').trim().toLowerCase();
      var avConfig = e.parameter.config || '';
      if (!avUser) return jsonResp({ok: false, error: 'missing username'});
      if (avConfig.length > 2000) return jsonResp({ok: false, error: 'config too long'});
      if (avConfig) {
        try { JSON.parse(avConfig); } catch (err) { return jsonResp({ok: false, error: 'invalid JSON: ' + err}); }
      }
      var avSheet = ss.getSheetByName('Pouzivatelia');
      if (!avSheet) return jsonResp({ok: false, error: 'Sheet Pouzivatelia nenajdeny'});
      var avRows = avSheet.getDataRange().getValues();
      var avHeader = avRows[0] || [];
      var avIdx = -1;
      for (var ahi = 0; ahi < avHeader.length; ahi++) {
        if (String(avHeader[ahi] || '').trim().toLowerCase() === 'avatar') { avIdx = ahi; break; }
      }
      if (avIdx < 0) return jsonResp({ok: false, error: 'avatar column not found in Pouzivatelia header'});
      for (var ari = 1; ari < avRows.length; ari++) {
        if (String(avRows[ari][0] || '').trim().toLowerCase() === avUser) {
          avSheet.getRange(ari + 1, avIdx + 1).setValue(avConfig);
          return jsonResp({ok: true});
        }
      }
      return jsonResp({ok: false, error: 'user not found: ' + avUser});
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

      // KOREKCIE PREDAJOV — záložka "Predaje_korekcie"
      // Stĺpce: login | meno | rok | mesiac | produkt | hodnota | zdroj
      // Korekcia prepíše iba konkrétnu hodnotu login × rok × mesiac × produkt.
      var korekcieSheet = ss.getSheetByName('Predaje_korekcie');
      if (korekcieSheet) {
        applyPredajeCorrections(predajeByRep, korekcieSheet.getDataRange().getValues(), rokA, qMonths);
      }

      var pacientiData = readGynPacienti_(ss, rokA, qA);

      return jsonResp({
        ok:              true,
        rok:             rokA,
        Q:               qA,
        plan:            planByRep,
        predaje:         predajeByRep,
        pacienti:        pacientiData,
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

    // ── PHARMA DATA — trhový podiel pre gyn produkty ──
    // URL: ?action=getPharmaData&oblast=BAPA&produkt=Levosert&kvartal=2601&token=xxx
    if (action === 'getPharmaData') {
      if (!requireToken(e)) return jsonResp({ok: false, error: 'Unauthorized'});
      var oblast  = (e.parameter.oblast  || '').trim().toUpperCase();
      var produkt = (e.parameter.produkt || '').trim();
      var kvartal = (e.parameter.kvartal || '').trim();
      if (!oblast || !produkt) return jsonResp({ok: false, error: 'missing params'});

      function hdrIdx(hdr, name) { return hdr.indexOf(name); }

      // ── Summary (PharmaData_Summary) ──
      var summRows = [];
      var summSheet = ss.getSheetByName('PharmaData_Summary');
      if (summSheet) {
        var sd = summSheet.getDataRange().getValues();
        if (sd.length > 1) {
          var sh = sd[0].map(function(c){ return String(c||'').trim().toLowerCase(); });
          var siP = hdrIdx(sh, 'produkt'),  siO = hdrIdx(sh, 'oblast'),  siM = hdrIdx(sh, 'mesiac');
          var siT = hdrIdx(sh, 'terit_ms'), siS = hdrIdx(sh, 'sk_ms');
          for (var i = 1; i < sd.length; i++) {
            var r = sd[i];
            if (String(r[siP] || '').trim() !== produkt) continue;
            if (String(r[siO] || '').trim().toUpperCase() !== oblast) continue;
            summRows.push({
              mesiac:   String(r[siM] || '').trim(),
              terit_ms: parseFloat(r[siT]) || 0,
              sk_ms:    parseFloat(r[siS]) || 0
            });
          }
        }
      }

      // ── Okresy (PharmaData_Okresy) ──
      var okresyRows = [];
      if (kvartal) {
        var okrSheet = ss.getSheetByName('PharmaData_Okresy');
        if (okrSheet) {
          var od = okrSheet.getDataRange().getValues();
          if (od.length > 1) {
            var oh = od[0].map(function(c){ return String(c||'').trim().toLowerCase(); });
            var oiP=hdrIdx(oh,'produkt'), oiO=hdrIdx(oh,'oblast'), oiOkr=hdrIdx(oh,'okres'), oiK=hdrIdx(oh,'kvartal');
            var oiN1=hdrIdx(oh,'nas_m1'), oiN2=hdrIdx(oh,'nas_m2'), oiN3=hdrIdx(oh,'nas_m3');
            function komp(row, prefix) {
              var iN = hdrIdx(oh, prefix+'_nazov'),
                  iM1 = hdrIdx(oh, prefix+'_m1'),
                  iM2 = hdrIdx(oh, prefix+'_m2'),
                  iM3 = hdrIdx(oh, prefix+'_m3');
              var name = String(row[iN]||'').trim();
              if (!name) return null;
              return {
                name: name,
                m1: parseFloat(row[iM1]) || null,
                m2: parseFloat(row[iM2]) || null,
                m3: parseFloat(row[iM3]) || null
              };
            }
            for (var i = 1; i < od.length; i++) {
              var r = od[i];
              if (String(r[oiP] || '').trim() !== produkt) continue;
              if (String(r[oiO] || '').trim().toUpperCase() !== oblast) continue;
              if (String(r[oiK] || '').trim() !== kvartal) continue;
              okresyRows.push({
                okres:  String(r[oiOkr] || '').trim(),
                nas_m1: parseFloat(r[oiN1]) || null,
                nas_m2: parseFloat(r[oiN2]) || null,
                nas_m3: parseFloat(r[oiN3]) || null,
                k1: komp(r, 'k1'),
                k2: komp(r, 'k2'),
                k3: komp(r, 'k3')
              });
            }
          }
        }
      }

      return jsonResp({ok: true, summary: summRows, okresy: okresyRows});
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

function readGynPacienti_(ss, rok, q) {
  var out = { territory: {}, districts: {} };
  var sheet = ss.getSheetByName('Gyn_Pacienti');
  if (!sheet) return out;
  var rows = sheet.getDataRange().getValues();
  if (!rows || rows.length < 2) return out;
  var hdr = rows[0].map(function(h){ return String(h || '').trim().toLowerCase(); });
  function idx(name) { return hdr.indexOf(name); }
  var iRok = idx('rok');
  var iQ = idx('q');
  var iRegion = idx('region');
  var iProdukt = idx('produkt');
  var iOkres = idx('okres');
  var iEur = idx('plan_eur');
  var iPac = idx('plan_pacienti');
  var iEurPac = idx('eur_na_pacienta');
  if (iRok < 0 || iQ < 0 || iRegion < 0 || iProdukt < 0 || iEur < 0 || iPac < 0) return out;

  for (var r = 1; r < rows.length; r++) {
    var row = rows[r];
    if (parseInt(row[iRok]) !== rok) continue;
    if (parseInt(row[iQ]) !== q) continue;
    var region = String(row[iRegion] || '').trim().toUpperCase();
    var produkt = normalizeProd(row[iProdukt]);
    if (!region || !produkt) continue;
    var planEur = parseNum(row[iEur]);
    var planPac = parseNum(row[iPac]);
    if (planEur <= 0 && planPac <= 0) continue;
    var eurPac = iEurPac >= 0 ? parseNum(row[iEurPac]) : 0;
    if (eurPac <= 0 && planPac > 0) eurPac = planEur / planPac;
    var rec = {
      plan_eur: planEur,
      plan_pacienti: planPac,
      eur_na_pacienta: eurPac
    };
    var okres = iOkres >= 0 ? String(row[iOkres] || '').trim() : '';
    if (okres) {
      if (!out.districts[region]) out.districts[region] = {};
      if (!out.districts[region][produkt]) out.districts[region][produkt] = {};
      out.districts[region][produkt][okres.toLowerCase()] = rec;
    } else {
      if (!out.territory[region]) out.territory[region] = {};
      out.territory[region][produkt] = rec;
    }
  }
  return out;
}

function applyPredajeCorrections(predajeByRep, rows, rok, qMonths) {
  if (!rows || rows.length < 2) return;
  var hdr = rows[0].map(function(h){ return String(h || '').trim().toLowerCase(); });
  var iLogin = hdr.indexOf('login');
  var iRok = hdr.indexOf('rok');
  var iMesiac = hdr.indexOf('mesiac');
  var iProdukt = hdr.indexOf('produkt');
  var iHodnota = hdr.indexOf('hodnota');
  if (iLogin < 0 || iRok < 0 || iMesiac < 0 || iProdukt < 0 || iHodnota < 0) return;

  var seen = {};
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var repKey = String(row[iLogin] || '').trim().toLowerCase();
    if (!repKey) continue;
    if (parseInt(row[iRok]) !== rok) continue;
    var mes = parseInt(row[iMesiac]);
    if (qMonths.indexOf(mes) === -1) continue;
    var prodKey = normalizeProd(row[iProdukt]);
    if (!prodKey) continue;
    var corrKey = repKey + '|' + rok + '|' + mes + '|' + prodKey;
    if (seen[corrKey]) continue;
    seen[corrKey] = true;

    var val = parseNum(row[iHodnota]);
    if (!predajeByRep[repKey]) predajeByRep[repKey] = { total: {}, byMonth: {} };
    if (!predajeByRep[repKey].byMonth[mes]) predajeByRep[repKey].byMonth[mes] = {};

    var oldVal = parseNum(predajeByRep[repKey].byMonth[mes][prodKey]);
    predajeByRep[repKey].byMonth[mes][prodKey] = val;
    predajeByRep[repKey].total[prodKey] = parseNum(predajeByRep[repKey].total[prodKey]) - oldVal + val;
  }
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
