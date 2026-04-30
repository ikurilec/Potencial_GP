var SHEET_ID = '1V_-iRUpOM_rBk42iwiuvRJEt00rQHC4sxMB4auEQAFc';

// ── API TOKEN — ochrana endpointov pred neoprávneným prístupom ──
// Token musí sedieť pri každej požiadavke (okrem login).
// Hodnotu ulož aj do Script Properties (File → Project properties → Script properties → API_TOKEN)
// a nahraď tento fallback prázdnym reťazcom.
var API_TOKEN = PropertiesService.getScriptProperties().getProperty('API_TOKEN') || 'gr-potencial-2026';

function requireToken(e) {
  var token = e.parameter.token || '';
  return token === API_TOKEN;
}

function doGet(e) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var action = e.parameter.action || 'save';

    // ── PRIHLÁSENIE — token sa overuje ináč (username+password) ──
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
      if(!requireToken(e)) return jsonResponse({ok: false, error: 'Unauthorized'});
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
      if(!requireToken(e)) return jsonResponse({ok: false, error: 'Unauthorized'});
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
      if(!requireToken(e)) return jsonResponse({ok: false, error: 'Unauthorized'});
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
      if(!requireToken(e)) return jsonResponse({ok: false, error: 'Unauthorized'});
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
      if(!requireToken(e)) return jsonResponse({ok: false, error: 'Unauthorized'});
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
      if(!requireToken(e)) return jsonResponse({ok: false, error: 'Unauthorized'});
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
      if(!requireToken(e)) return jsonResponse({ok: false, error: 'Unauthorized'});
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
      if(!requireToken(e)) return jsonResponse({ok: false, error: 'Unauthorized'});
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
      if(!requireToken(e)) return jsonResponse({ok: false, error: 'Unauthorized'});
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
    // URL: ?action=getPharmaData&oblast=KE&produkt=TEL&kvartal=2601
    if(action === 'getPharmaData') {
      if(!requireToken(e)) return jsonResponse({ok: false, error: 'Unauthorized'});
      var oblast  = (e.parameter.oblast  || '').trim().toUpperCase();
      var produkt = (e.parameter.produkt || '').trim();
      var kvartal = (e.parameter.kvartal || '').trim();
      if(!oblast || !produkt) return jsonResponse({ok: false, error: 'missing params'});

      function hdrIdx(hdr, name) { return hdr.indexOf(name); }

      // ── Summary (PharmaData_Summary) ──
      var summRows = [];
      var summSheet = ss.getSheetByName('PharmaData_Summary');
      if(summSheet) {
        var sd = summSheet.getDataRange().getValues();
        if(sd.length > 1) {
          var sh = sd[0].map(function(c){ return String(c||'').trim().toLowerCase(); });
          var siP = hdrIdx(sh,'produkt'), siO = hdrIdx(sh,'oblast'), siM = hdrIdx(sh,'mesiac');
          var siT = hdrIdx(sh,'terit_ms'), siS = hdrIdx(sh,'sk_ms');
          for(var i=1;i<sd.length;i++){
            var r=sd[i];
            if(String(r[siP]||'').trim()!==produkt) continue;
            if(String(r[siO]||'').trim().toUpperCase()!==oblast) continue;
            summRows.push({
              mesiac:   String(r[siM]||'').trim(),
              terit_ms: parseFloat(r[siT])||0,
              sk_ms:    parseFloat(r[siS])||0
            });
          }
        }
      }

      // ── Okresy (PharmaData_Okresy) ──
      var okresyRows = [];
      if(kvartal) {
        var okrSheet = ss.getSheetByName('PharmaData_Okresy');
        if(okrSheet) {
          var od = okrSheet.getDataRange().getValues();
          if(od.length > 1) {
            var oh = od[0].map(function(c){ return String(c||'').trim().toLowerCase(); });
            var oiP=hdrIdx(oh,'produkt'), oiO=hdrIdx(oh,'oblast'), oiOkr=hdrIdx(oh,'okres'), oiK=hdrIdx(oh,'kvartal');
            var oiN1=hdrIdx(oh,'nas_m1'), oiN2=hdrIdx(oh,'nas_m2'), oiN3=hdrIdx(oh,'nas_m3');
            var oiNP1=hdrIdx(oh,'nas_pat_m1'), oiNP2=hdrIdx(oh,'nas_pat_m2'), oiNP3=hdrIdx(oh,'nas_pat_m3');
            var oiTP1=hdrIdx(oh,'tot_pat_m1'), oiTP2=hdrIdx(oh,'tot_pat_m2'), oiTP3=hdrIdx(oh,'tot_pat_m3');
            function komp(row,prefix){
              var iN=hdrIdx(oh,prefix+'_nazov'),iM1=hdrIdx(oh,prefix+'_m1'),iM2=hdrIdx(oh,prefix+'_m2'),iM3=hdrIdx(oh,prefix+'_m3');
              var name=String(row[iN]||'').trim(); if(!name) return null;
              return {name:name, m1:parseFloat(row[iM1])||null, m2:parseFloat(row[iM2])||null, m3:parseFloat(row[iM3])||null};
            }
            function pi(v){ var n=parseInt(v); return isNaN(n)?null:n; }
            for(var i=1;i<od.length;i++){
              var r=od[i];
              if(String(r[oiP]||'').trim()!==produkt) continue;
              if(String(r[oiO]||'').trim().toUpperCase()!==oblast) continue;
              if(String(r[oiK]||'').trim()!==kvartal) continue;
              okresyRows.push({
                okres:  String(r[oiOkr]||'').trim(),
                nas_m1: parseFloat(r[oiN1])||null, nas_m2: parseFloat(r[oiN2])||null, nas_m3: parseFloat(r[oiN3])||null,
                nas_pat_m1: pi(r[oiNP1]), nas_pat_m2: pi(r[oiNP2]), nas_pat_m3: pi(r[oiNP3]),
                tot_pat_m1: pi(r[oiTP1]), tot_pat_m2: pi(r[oiTP2]), tot_pat_m3: pi(r[oiTP3]),
                k1: komp(r,'k1'), k2: komp(r,'k2'), k3: komp(r,'k3')
              });
            }
          }
        }
      }

      return jsonResponse({ok:true, summary:summRows, okresy:okresyRows});
    }

    // ── PHARMA OKRES GRAF — historický MS% nášho produktu + všetci konkurenti per mesiac per okres ──
    // URL: ?action=getPharmaOkresGraf&produkt=TEL&oblast=DS&okres=Dunajská Streda
    if(action === 'getPharmaOkresGraf') {
      if(!requireToken(e)) return jsonResponse({ok: false, error: 'Unauthorized'});
      var produkt = (e.parameter.produkt || '').trim().toUpperCase();
      var oblast  = (e.parameter.oblast  || '').trim().toUpperCase();
      var okres   = (e.parameter.okres   || '').trim();
      if(!produkt || !oblast || !okres) return jsonResponse({ok:false, error:'missing params'});

      var ogSheet = ss.getSheetByName('PharmaData_OkresyGraf');
      if(!ogSheet) return jsonResponse({ok:false, error:'Tab PharmaData_OkresyGraf nenajdeny'});

      var ogd = ogSheet.getDataRange().getValues();
      if(ogd.length < 2) return jsonResponse({ok:true, rows:[]});

      var ogh = ogd[0].map(function(c){ return String(c||'').trim().toLowerCase(); });
      var giP=ogh.indexOf('produkt'), giO=ogh.indexOf('oblast'), giOk=ogh.indexOf('okres');
      var giM=ogh.indexOf('mesiac'), giNM=ogh.indexOf('nas_ms');

      // Nájdi všetky k*_nazov / k*_ms stĺpce dynamicky
      var kompCols = [];
      for(var ci=0;ci<ogh.length;ci++){
        if(/^k\d+_nazov$/.test(ogh[ci])){
          var msIdx = ogh.indexOf(ogh[ci].replace('_nazov','_ms'));
          if(msIdx>=0) kompCols.push({n:ci, m:msIdx});
        }
      }

      var rows = [];
      for(var i=1;i<ogd.length;i++){
        var r=ogd[i];
        if(String(r[giP]||'').trim().toUpperCase()!==produkt) continue;
        if(String(r[giO]||'').trim().toUpperCase()!==oblast) continue;
        if(String(r[giOk]||'').trim()!==okres) continue;
        var mesiac = String(r[giM]||'').trim();
        if(!mesiac) continue;
        var row = {mesiac:mesiac, nas_ms: parseFloat(r[giNM])||null, komp:[]};
        kompCols.forEach(function(kc){
          var name=String(r[kc.n]||'').trim();
          if(!name) return;
          row.komp.push({name:name, ms:parseFloat(r[kc.m])||null});
        });
        rows.push(row);
      }
      rows.sort(function(a,b){return a.mesiac.localeCompare(b.mesiac);});
      return jsonResponse({ok:true, produkt:produkt, oblast:oblast, okres:okres, rows:rows});
    }

    // ── PHARMA GRAF DÁTA — trend MS% nášho produktu + top 4 konkurenti ──
    // URL: ?action=getPharmaGraf&produkt=VID&oblast=BAMA
    if(action === 'getPharmaGraf') {
      if(!requireToken(e)) return jsonResponse({ok: false, error: 'Unauthorized'});
      var produkt = (e.parameter.produkt || '').trim().toUpperCase();
      var oblast  = (e.parameter.oblast  || '').trim().toUpperCase();
      if(!produkt || !oblast) return jsonResponse({ok: false, error: 'missing produkt or oblast'});

      var grafSheet = ss.getSheetByName('PharmaData_Graf');
      if(!grafSheet) return jsonResponse({ok: false, error: 'Tab PharmaData_Graf nenajdeny'});

      var gd = grafSheet.getDataRange().getValues();
      if(gd.length < 2) return jsonResponse({ok: true, produkt: produkt, oblast: oblast, rows: []});

      var gh = gd[0].map(function(c){ return String(c||'').trim().toLowerCase(); });
      var giP  = gh.indexOf('produkt');
      var giO  = gh.indexOf('oblast');
      var giM  = gh.indexOf('mesiac');
      var giNM = gh.indexOf('nas_ms');
      var giK1n = gh.indexOf('k1_nazov'); var giK1m = gh.indexOf('k1_ms');
      var giK2n = gh.indexOf('k2_nazov'); var giK2m = gh.indexOf('k2_ms');
      var giK3n = gh.indexOf('k3_nazov'); var giK3m = gh.indexOf('k3_ms');

      var rows = [];
      for(var i = 1; i < gd.length; i++) {
        var r = gd[i];
        if(String(r[giP]||'').trim().toUpperCase() !== produkt) continue;
        if(String(r[giO]||'').trim().toUpperCase() !== oblast)  continue;
        rows.push({
          mesiac:   String(r[giM]  ||'').trim(),
          nas_ms:   parseFloat(r[giNM]) || 0,
          k1_nazov: String(r[giK1n]||'').trim(), k1_ms: parseFloat(r[giK1m]) || 0,
          k2_nazov: String(r[giK2n]||'').trim(), k2_ms: parseFloat(r[giK2m]) || 0,
          k3_nazov: String(r[giK3n]||'').trim(), k3_ms: parseFloat(r[giK3m]) || 0
        });
      }

      // Zoraď podľa mesiaca (YYMM)
      rows.sort(function(a, b){ return a.mesiac.localeCompare(b.mesiac); });

      return jsonResponse({ok: true, produkt: produkt, oblast: oblast, rows: rows});
    }

    // ── GET CONFIG — číta hodnotu z tabu "Config" ──
    if(action === 'getConfig') {
      if(!requireToken(e)) return jsonResponse({ok: false, error: 'Unauthorized'});
      var key = (e.parameter.key || '').trim();
      if(!key) return jsonResponse({ok: false, error: 'missing key'});
      var cfgSheet = ss.getSheetByName('Config');
      if(!cfgSheet) return jsonResponse({ok: true, value: null});
      var rows = cfgSheet.getDataRange().getValues();
      for(var i = 0; i < rows.length; i++){
        if(String(rows[i][0]||'').trim() === key){
          var v = rows[i][1];
          return jsonResponse({ok: true, value: (v === '' || v === null || v === undefined) ? null : String(v)});
        }
      }
      return jsonResponse({ok: true, value: null});
    }

    // ── SET CONFIG — zapisuje hodnotu do tabu "Config" (len admin) ──
    if(action === 'setConfig') {
      if(!requireToken(e)) return jsonResponse({ok: false, error: 'Unauthorized'});
      var key = (e.parameter.key || '').trim();
      var value = e.parameter.value;
      if(!key) return jsonResponse({ok: false, error: 'missing key'});
      var cfgSheet = ss.getSheetByName('Config');
      if(!cfgSheet){
        cfgSheet = ss.insertSheet('Config');
        cfgSheet.getRange(1,1).setValue('key');
        cfgSheet.getRange(1,2).setValue('value');
      }
      var rows = cfgSheet.getDataRange().getValues();
      for(var i = 0; i < rows.length; i++){
        if(String(rows[i][0]||'').trim() === key){
          cfgSheet.getRange(i + 1, 2).setValue(value);
          return jsonResponse({ok: true});
        }
      }
      // Kľúč neexistuje — pridaj nový riadok
      cfgSheet.appendRow([key, value]);
      return jsonResponse({ok: true});
    }

    // ── MILESTONE ŠTATISTIKY — celkový počet unikátnych lekárov v systéme ──
    if(action === 'getMilestoneStats') {
      var sheet = ss.getSheets()[0];
      var rows = sheet.getDataRange().getValues();
      if(rows.length < 2) return jsonResponse({total:0, highPotentialPct:0, vyraditPct:0});
      var headers = rows[0].map(function(h){ return String(h||'').trim().toLowerCase().replace(/\s+/g,'_'); });
      var lekarIdx = headers.indexOf('lekar');
      var potentialIdx = headers.indexOf('rocny_potential');
      var scenarIdx = headers.indexOf('scenar');
      if(lekarIdx === -1) return jsonResponse({total:0, highPotentialPct:0, vyraditPct:0});
      // Posledný záznam pre každého lekára (sheet je chronologický — posledný riadok vyhráva)
      var doctors = {};
      for(var i = 1; i < rows.length; i++) {
        var lekar = String(rows[i][lekarIdx]||'').trim();
        if(!lekar) continue;
        var rp = potentialIdx !== -1 ? (parseFloat(rows[i][potentialIdx]) || 0) : 0;
        var sc = scenarIdx !== -1 ? String(rows[i][scenarIdx]||'').trim() : '';
        doctors[lekar] = { rp: rp, sc: sc };
      }
      var total = Object.keys(doctors).length;
      var highCount = 0, vyraditCount = 0;
      Object.keys(doctors).forEach(function(k) {
        if(doctors[k].rp >= 3700) highCount++;
        if(doctors[k].sc === 'vyradit') vyraditCount++;
      });
      return jsonResponse({
        total: total,
        highPotentialPct: total > 0 ? Math.round(highCount / total * 100) : 0,
        vyraditPct: total > 0 ? Math.round(vyraditCount / total * 100) : 0
      });
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
