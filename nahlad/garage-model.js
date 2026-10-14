/* Pure Satori Garage domain. No staff records, credentials or spreadsheet IDs. */
var SatoriGarageModel = (function () {
  'use strict';
  var ROLES = ['office', 'management', 'fleet', 'admin'];
  function fail(code, message) { var e = new Error(message); e.code = code; throw e; }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function login(value) {
    var v = String(value || '').trim().toLowerCase();
    if (!v || v.length > 120 || /[\s\u0000-\u001f]/.test(v)) fail('INVALID_MEMBER', 'Vyberte platný existujúci účet.');
    return v;
  }
  function text(value, max) { return String(value || '').trim().slice(0, max || 160); }
  function vehicle(value) {
    var v=value||{},brand=String(v.brand||'').trim(),color=String(v.color||'#64748b').toLowerCase();
    if(brand.length>60||/[\u0000-\u001f\u007f]/.test(brand)||!/^#[0-9a-f]{6}$/.test(color)||v.kind!==undefined&&v.kind!=='other')fail('INVALID_VEHICLE','Zadajte model auta do 60 znakov a platnú farbu.');
    var out={brand:brand,color:color};
    if(v.kind==='other'){
      var raw=typeof v.plate==='string'?v.plate:'',plate=raw.trim().toUpperCase().replace(/ +/g,' ');
      if(!brand||/[\u0000-\u001f\u007f]/.test(raw)||!/^[- A-Z0-9\u00C0-\u024F]{2,20}$/.test(plate))fail('INVALID_VEHICLE','Pri inom aute vyplňte model a platnú ŠPZ do 20 znakov.');
      out.kind='other';out.plate=plate;
    }
    return out;
  }
  function fleetName(value) { if (typeof value !== 'string' || !value.trim() || value.trim().length > 120 || /[\u0000-\u001f\u007f]/.test(value)) fail('INVALID_PAYLOAD', 'Zadajte celé meno osoby do 120 znakov.'); return value.trim(); }
  function fleetVehicle(value) { if (!value || typeof value !== 'object' || Array.isArray(value) || typeof value.brand !== 'string' || !value.brand.trim() || value.brand.trim().length > 60 || /[\u0000-\u001f\u007f]/.test(value.brand) || typeof value.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(value.color)) fail('INVALID_VEHICLE', 'Zadajte značku auta do 60 znakov a platnú farbu.'); return vehicle(value); }
  function date(value) {
    var v = String(value || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || !isFinite(Date.parse(v + 'T00:00:00Z')) || new Date(v + 'T00:00:00Z').toISOString().slice(0, 10) !== v) fail('INVALID_DATE', 'Dátum nie je platný.');
    return v;
  }
  function windowFor(today) { var start = date(today); return { start: start, end: new Date(Date.parse(start + 'T00:00:00Z') + 29 * 86400000).toISOString().slice(0, 10) }; }
  function inWindow(value, context) { var v = date(value), w = windowFor(context.today); if (v < w.start || v > w.end) fail('DATE_WINDOW', 'Upravovať môžete iba dnešok a nasledujúcich 29 dní.'); return v; }
  function clock(value) { var v = String(value || ''); if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) fail('INVALID_TIME', 'Zadajte platný čas.'); return v; }
  function interval(p, config) { var start = clock(p.start || config.defaultStart), end = clock(p.end || config.defaultEnd); if (start >= end) fail('INVALID_TIME', 'Koniec musí byť neskôr ako začiatok.'); return { start: start, end: end }; }
  function overlaps(a, b) { return a.date === b.date && a.start < b.end && b.start < a.end; }
  function member(state, id) { return state.members.find(function (m) { return m.id === id && m.active !== false; }); }
  function actorMember(state, actor) { var m = member(state, login(actor && actor.id)); if (!m || m.access === false) fail('NOT_MEMBER', 'Nemáte aktívny prístup do Garáže.'); return m; }
  function canAdmin(m) { return m.role === 'admin' || m.role === 'fleet'; }
  function admin(m) { if (!canAdmin(m)) fail('FORBIDDEN', 'Túto zmenu môže urobiť iba správca Garáže.'); }
  function own(row, m) { if (!row) fail('NOT_FOUND', 'Záznam už neexistuje. Obnovte údaje.'); if (row.owner !== m.id) fail('FORBIDDEN', 'Môžete upraviť iba svoje záznamy.'); }
  function isFleet(row) { return row.kind === 'fleet'; }
  function reservationKind(payload, row, m) {
    if (payload.kind === 'fleet' || (row && isFleet(row))) admin(m);
    if (payload.kind !== undefined && payload.kind !== 'personal' && payload.kind !== 'fleet') fail('INVALID_PAYLOAD', 'Vyberte platný druh rezervácie.');
    var kind = row ? (isFleet(row) ? 'fleet' : 'personal') : (payload.kind || 'personal');
    if (row && payload.kind !== undefined && payload.kind !== kind) fail('INVALID_PAYLOAD', 'Druh existujúcej rezervácie nemôžete zmeniť.');
    return kind;
  }
  function personalOverlap(a, b) { return a.owner === b.owner && !isFleet(a) && !isFleet(b); }
  function slotAllowed(slot, m) { return (!slot.allowedMembers || !slot.allowedMembers.length || slot.allowedMembers.indexOf(m.id) >= 0) && (!slot.allowedRoles || !slot.allowedRoles.length || slot.allowedRoles.indexOf(m.role) >= 0); }
  function slotFor(state, id, m) { var slot = state.config.slots.find(function (s) { return s.id === id && s.active; }); if (!slot) fail('INVALID_SPACE', 'Parkovacie miesto nie je dostupné.'); if (m && !slotAllowed(slot, m)) fail('RESTRICTED', 'Na toto parkovacie miesto nemáte oprávnenie.'); return slot; }
  var REAL_NUMBERS = ['587', '588', '590', '589', '612', '613'];
  function layoutNeedsMigration(state) { return state.config.layoutVersion !== 2; }
  function migrateLayout(state, context) {
    if (!layoutNeedsMigration(state)) return false;
    var old = REAL_NUMBERS.map(function (_, i) { return state.config.slots.find(function (s) { return s.id === 'b3-' + (i + 1) && s.floor === -3; }); });
    old.forEach(function (s, i) { if (s && s.number === String(i + 1)) s.number = REAL_NUMBERS[i]; });
    state.config.slots.filter(function (s) { return s.floor === -1; }).forEach(function (s) { s.number = ''; });
    (state.outbox || []).forEach(function (item) { var n = item.notice, s = n && state.config.slots.find(function (s) { return s.id === n.spaceId; }); if (s) n.number = s.number; });
    state.config.layoutVersion = 2; state.version++;
    state.audit.push({ id: uniqueId(state, context, 'a'), actor: 'system', name: 'Satori Garáž', time: context.now, command: 'garageLayoutUpdate', version: state.version }); state.audit = state.audit.slice(-1000);
    return true;
  }
  function poolSlots(state) { return state.config.slots.filter(function (s) { return s.floor === -1 && s.active; }).sort(function (a, b) { return a.order - b.order; }); }
  function poolNodes(state, day, additions, ignored, focus) {
    var slots = poolSlots(state), ids = slots.map(function (s) { return s.id; });
    if (!slots.length) fail('INVALID_SPACE', 'Parkovanie na −1 je momentálne nedostupné.');
    if (slots.length > 2) fail('INVALID_SPACE', 'Na −1 sú dostupné najviac dve parkovacie miesta.');
    var rows = state.reservations.filter(function (r) { return r.date === day && ignored.indexOf(r.id) < 0 && state.config.slots.some(function (s) { return s.id === r.spaceId && s.floor === -1; }); }).concat(additions || []);
    var nodes = rows.map(function (r) { return { row: r, block: false }; });
    // Two blocks on the same capacity unit mean one unavailable place, not two.
    ids.forEach(function (id) { var blocks = (state.blocks || []).filter(function (b) { return b.date === day && b.spaceId === id; }).sort(function (a, b) { return a.start.localeCompare(b.start); }), merged = [];
      blocks.forEach(function (b) { var prev = merged[merged.length - 1]; if (prev && b.start <= prev.end) prev.end = prev.end > b.end ? prev.end : b.end; else merged.push({ date: day, spaceId: id, start: b.start, end: b.end }); });
      merged.forEach(function (b) { nodes.push({ row: b, allowed: ids.slice(), block: true }); });
    });
    // A candidate only affects its connected interval component. Unrelated
    // stale bookings must not prevent parking at a different time that day.
    if (focus && focus.length) { var connected = focus.slice(), selected = [];
      for (var q = 0; q < connected.length; q++) nodes.forEach(function (n, i) { if (!selected[i] && (n.row === connected[q] || overlaps(n.row, connected[q]))) { selected[i] = true; connected.push(n.row); } });
      nodes = nodes.filter(function (_, i) { return selected[i]; });
    }
    nodes.forEach(function (n) { if (n.block) return; var m = member(state, n.row.owner); if (!m) fail('NOT_MEMBER', 'Rezervácia nemá aktívneho používateľa.');
      // Retained cars of revoked accounts still occupy their assigned capacity
      // unit even if their source role no longer permits new parking there.
      n.allowed = m.access === false ? ids.filter(function (id) { return id === n.row.spaceId; }) : slots.filter(function (s) { return slotAllowed(s, m); }).map(function (s) { return s.id; });
      if (!n.allowed.length) fail('RESTRICTED', 'Na parkovanie na −1 nemáte oprávnenie.'); });
    return { slots: slots, nodes: nodes };
  }
  function repackPool(state, day, additions, ignored) {
    var pool = poolNodes(state, day, additions, ignored || [], additions), nodes = pool.nodes, ids = pool.slots.map(function (s) { return s.id; }), edges = nodes.map(function () { return []; }), colors = [], components = [];
    for (var i = 0; i < nodes.length; i++) for (var j = i + 1; j < nodes.length; j++) if (overlaps(nodes[i].row, nodes[j].row)) { edges[i].push(j); edges[j].push(i); }
    // Interval graphs with concurrency <= 2 are bipartite. Each connected
    // component has only two orientations, so this avoids exponential search.
    for (var root = 0; root < nodes.length; root++) if (colors[root] === undefined) { var component = [], queue = [root]; colors[root] = 0;
      for (var q = 0; q < queue.length; q++) { var at = queue[q]; component.push(at); for (var e = 0; e < edges[at].length; e++) { var to = edges[at][e]; if (colors[to] === undefined) { colors[to] = 1 - colors[at]; queue.push(to); } else if (colors[to] === colors[at]) fail('CONFLICT', 'Na −1 už sú v tomto čase rezervované obe miesta.'); } }
      var best = null;
      for (var flip = 0; flip < ids.length; flip++) { var assignment = [], score = 0, valid = true;
        for (var k = 0; k < component.length; k++) { var index = component[k], id = ids[colors[index] ^ flip]; if (!id || nodes[index].allowed.indexOf(id) < 0) { valid = false; break; } assignment.push({ index: index, id: id }); if (nodes[index].row.spaceId === id) score++; }
        if (valid && (!best || score > best.score)) best = { score: score, assignment: assignment };
      }
      if (!best) fail('CONFLICT', 'Parkovanie na −1 nie je v tomto čase dostupné pre tento účet.'); components.push(best.assignment);
    }
    components.forEach(function (assignment) { assignment.forEach(function (a) { if (!nodes[a.index].block) nodes[a.index].row.spaceId = a.id; }); });
  }
  function poolAvailability(state, actor, request, context) {
    var result = { capacity: 0, available: 0, canReserve: false };
    try {
      var p = request || {}, slots = poolSlots(state); result.capacity = slots.length;
      var m = actorMember(state, actor), row = p.id ? state.reservations.find(function (r) { return r.id === p.id; }) : null;
      if (p.id) own(row, m); var kind = reservationKind(p, row, m);
      var bounds = context || (state.serverDate ? { today: state.serverDate } : null), day = bounds ? inWindow(p.date, bounds) : date(p.date), times = interval(p, state.config), target = Object.assign({ date: day }, times), copyState = copy({ config: state.config, members: state.members, reservations: state.reservations, blocks: state.blocks || [] }), events = [], maximum = 0, count = 0;
      if (row && bounds) inWindow(row.date, bounds);
      if (slots.length) poolNodes(state, day, [], p.id ? [p.id] : [], [target]).nodes.forEach(function (n) { if (overlaps(n.row, target)) { events.push({ time: n.row.start < times.start ? times.start : n.row.start, delta: 1 }, { time: n.row.end > times.end ? times.end : n.row.end, delta: -1 }); } });
      events.sort(function (a, b) { return a.time.localeCompare(b.time) || a.delta - b.delta; }).forEach(function (e) { count += e.delta; maximum = Math.max(maximum, count); });
      result.available = Math.max(0, slots.length - maximum);
      var eligible = slots.find(function (s) { return slotAllowed(s, m); }); if (!eligible) fail('RESTRICTED', 'Na parkovanie na −1 nemáte oprávnenie.'); var r = Object.assign({ id: p.id || '__capacity_preview__', owner: m.id, date: day, spaceId: eligible.id }, times); if (kind === 'fleet') r.kind = 'fleet'; allocation(copyState, r, p.id ? [p.id] : []); result.canReserve = true;
    } catch (e) { result.code = e.code || 'CONFLICT'; result.message = e.message; }
    return result;
  }
  function allocation(state, r, ignore) {
    var m = member(state, r.owner); if (!m) fail('NOT_MEMBER', 'Príjemca nemá aktívny prístup do Garáže.'); var target = slotFor(state, r.spaceId);
    if (target.floor === -1) { if (state.reservations.some(function (x) { return ignore.indexOf(x.id) < 0 && personalOverlap(x, r) && overlaps(x, r); })) fail('CONFLICT', 'V tomto čase už máte inú rezerváciu parkovania.'); repackPool(state, r.date, [r], ignore); return; }
    slotFor(state, r.spaceId, m);
    if (state.reservations.some(function (x) { return ignore.indexOf(x.id) < 0 && overlaps(x, r) && (x.spaceId === r.spaceId || personalOverlap(x, r)); }) || state.blocks.some(function (b) { return b.spaceId === r.spaceId && overlaps(b, r); })) fail('CONFLICT', 'Miesto alebo osoba má v tomto čase inú rezerváciu.');
  }
  function uniqueId(state, context, prefix) { var used = state.reservations.concat(state.offers, state.blocks, state.audit); for (var i = 0; i < 20; i++) { var v = prefix + '-' + String(context.id ? context.id() : state.version + '-' + i); if (!used.some(function (x) { return x.id === v; })) return v; } fail('ID_FAILURE', 'Záznam sa nepodarilo vytvoriť. Skúste znova.'); }
  function ensureAttendance(state, m, day, times) {
    var row = state.attendance.find(function (x) { return x.owner === m.id && x.date === day; });
    if (!row) { row = { date: day, owner: m.id, name: m.name, start: times.start, end: times.end }; state.attendance.push(row); }
    else { row.start = row.start < times.start ? row.start : times.start; row.end = row.end > times.end ? row.end : times.end; }
  }
  function releaseNotice(row, state) { var s = state.config.slots.find(function (x) { return x.id === row.spaceId; }); return { type: 'release', audience: 'all', date: row.date, spaceId: row.spaceId, number: s ? s.number : row.spaceId, floor: s ? s.floor : null, start: row.start, end: row.end }; }
  function freedIntervals(previous, replacement, state) {
    var a = state.config.slots.find(function (s) { return s.id === previous.spaceId; }), b = replacement && state.config.slots.find(function (s) { return s.id === replacement.spaceId; }), samePlace = replacement && (previous.spaceId === replacement.spaceId || (a && b && a.floor === -1 && b.floor === -1));
    if (!replacement || previous.date !== replacement.date || !samePlace || !overlaps(previous, replacement)) return [releaseNotice(previous, state)];
    var out = []; if (previous.start < replacement.start) out.push(releaseNotice(Object.assign({}, previous, { end: replacement.start < previous.end ? replacement.start : previous.end }), state)); if (replacement.end < previous.end) out.push(releaseNotice(Object.assign({}, previous, { start: replacement.end > previous.start ? replacement.end : previous.start }), state)); return out;
  }
  function clearOwnWaiting(state, m, day) { state.waitlist = state.waitlist.filter(function (x) { return x.owner !== m.id || x.date !== day; }); }
  function parkingTargets(state, m, chosen) {
    var eligible = state.config.slots.filter(function (s) { return s.active && (s.floor === -3 || s.floor === -1) && slotAllowed(s, m); }).sort(function (a, b) { return (a.floor === -3 ? 0 : 1) - (b.floor === -3 ? 0 : 1) || a.order - b.order; });
    if (chosen === undefined) return eligible;
    if (typeof chosen !== 'string' || !chosen) fail('INVALID_SPACE', 'Vyberte platné parkovanie.');
    if (chosen === 'pool:-1') { var pool = eligible.filter(function (s) { return s.floor === -1; }); if (!pool.length) fail('RESTRICTED', 'Parkovanie na −1 nie je dostupné pre tento účet.'); return pool; }
    var slot = slotFor(state, chosen, m); if (slot.floor !== -3) fail('INVALID_SPACE', 'Na −1 vyberte spoločné parkovanie bez čísla.'); return [slot];
  }
  function attendanceParkingChoices(state, actor, request, context) {
    var m = actorMember(state, actor), p = request || {}, bounds = context || { today: state.serverDate };
    if (!Array.isArray(p.dates) || !p.dates.length || p.dates.length > 30) fail('INVALID_PAYLOAD', 'Vyberte dni príchodu.');
    var dates = p.dates.map(function (d) { return inWindow(d, bounds); }), times = interval(p, state.config), eligible = parkingTargets(state, m), choices = eligible.filter(function (s) { return s.floor === -3; }).map(function (s) { return { value: s.id, label: 'Miesto ' + s.number + ' · −3' }; });
    if (eligible.some(function (s) { return s.floor === -1; })) choices.push({ value: 'pool:-1', label: 'Parkovanie na −1' });
    return choices.filter(function (choice) {
      var trial = copy({ config: state.config, members: state.members, reservations: state.reservations, blocks: state.blocks || [] });
      trial.reservations = trial.reservations.filter(function (r) { return r.owner !== m.id || dates.indexOf(r.date) < 0 || isFleet(r); });
      return dates.every(function (day) { var target = parkingTargets(trial, m, choice.value)[0], r = Object.assign({ id: '__attendance_preview__', owner: m.id, date: day, spaceId: target.id }, times); try { allocation(trial, r, []); return true; } catch (e) { if (['CONFLICT','RESTRICTED','INVALID_SPACE'].indexOf(e.code) >= 0) return false; throw e; } });
    });
  }
  function autoParking(state, m, day, times, context, notices, chosen) {
    var previous = state.reservations.filter(function (r) { return r.owner === m.id && r.date === day && !isFleet(r); }), result = { date: day, start: times.start, end: times.end }, eligible = parkingTargets(state, m, chosen);
    var covering = previous.find(function (r) { return (chosen === undefined ? r.start <= times.start && r.end >= times.end : r.start === times.start && r.end === times.end) && eligible.some(function (s) { return s.id === r.spaceId; }); });
    if (covering) { clearOwnWaiting(state, m, day); result.status = 'existing'; result.reservationId = covering.id; result.spaceId = covering.spaceId; return result; }
    if (eligible.length) {
      var preferred = previous.length && eligible.find(function (s) { return s.id === previous[0].spaceId; });
      if (preferred) eligible = [preferred].concat(eligible.filter(function (s) { return s.id !== preferred.id; }));
      var id = previous.length ? previous[0].id : uniqueId(state, context, 'r');
      for (var i = 0; i < eligible.length; i++) {
        // Shared −1 allocation may repack other rows. Each attempt therefore runs
        // on a separate trial; an unavailable extension never destroys old parking.
        var trial = copy({ config: state.config, members: state.members, reservations: state.reservations, blocks: state.blocks }), reservation = { id: id, revision: previous.length ? previous[0].revision + 1 : 1, date: day, owner: m.id, name: m.name, spaceId: eligible[i].id, start: times.start, end: times.end };
        trial.reservations = trial.reservations.filter(function (r) { return r.owner !== m.id || r.date !== day || isFleet(r); });
        try { allocation(trial, reservation, []); }
        catch (error) { if (['CONFLICT','RESTRICTED','INVALID_SPACE'].indexOf(error.code) >= 0) continue; throw error; }
        trial.reservations.push(reservation); state.reservations = trial.reservations;
        previous.forEach(function (r) { freedIntervals(r, reservation, state).forEach(function (n) { notices.push(n); }); });
        clearOwnWaiting(state, m, day); result.status = 'reserved'; result.reservationId = reservation.id; result.spaceId = reservation.spaceId; return result;
      }
      if (chosen !== undefined) fail('CONFLICT', 'Vybrané miesto už nie je voľné na ' + day + ' v čase ' + times.start + ' – ' + times.end + '. Obnovte dostupnosť a vyberte iné miesto.');
      clearOwnWaiting(state, m, day); state.waitlist.push({ date: day, owner: m.id, start: times.start, end: times.end }); result.status = previous.length ? 'partlyWaiting' : 'waiting';
    } else { clearOwnWaiting(state, m, day); result.status = 'restricted'; }
    if (previous.length) result.existingReservations = copy(previous);
    return result;
  }
  function poolBlockReleases(previous, beforeBlocks, state) {
    var ids = state.config.slots.filter(function (s) { return s.floor === -1; }).map(function (s) { return s.id; }), relevant = function (b) { return ids.indexOf(b.spaceId) >= 0 && overlaps(b, previous); }, before = beforeBlocks.filter(relevant), after = state.blocks.filter(relevant), points = [previous.start, previous.end], out = [];
    before.concat(after).forEach(function (b) { points.push(b.start > previous.start ? b.start : previous.start, b.end < previous.end ? b.end : previous.end); });
    points = points.filter(function (t, i, all) { return all.indexOf(t) === i; }).sort();
    var countAt = function (rows, t) { return ids.filter(function (id) { return rows.some(function (b) { return b.spaceId === id && b.start <= t && t < b.end; }); }).length; };
    for (var i = 0; i < points.length - 1; i++) if (countAt(before, points[i]) > countAt(after, points[i])) { var last = out[out.length - 1]; if (last && last.end === points[i]) last.end = points[i + 1]; else out.push(releaseNotice(Object.assign({}, previous, { start: points[i], end: points[i + 1] }), state)); }
    return out;
  }
  function stable(value) { if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']'; if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(function (k) { return JSON.stringify(k) + ':' + stable(value[k]); }).join(',') + '}'; return JSON.stringify(value); }
  function commandId(value) { if (!/^[A-Za-z0-9][A-Za-z0-9_.:-]{7,127}$/.test(String(value || ''))) fail('INVALID_COMMAND_ID', 'Požiadavka nemá platný identifikátor. Skúste znova.'); return String(value); }
  function createState() {
    var slots = [];
    for (var i = 1; i <= 8; i++) slots.push({ id: (i <= 6 ? 'b3-' : 'b1-') + i, number: i <= 6 ? REAL_NUMBERS[i - 1] : '', floor: i <= 6 ? -3 : -1, order: i - 1, active: true });
    return { schema: 1, version: 1, config: { slots: slots, layoutVersion: 2, defaultStart: '08:00', defaultEnd: '16:30', workingDays: [1, 2, 3, 4, 5] }, members: [], attendance: [], reservations: [], offers: [], waitlist: [], blocks: [], audit: [], dedup: [], outbox: [] };
  }
  function apply(state, actor, command, payload, context) {
    context = context || {}; windowFor(context.today);
    if (!context.now || !isFinite(Date.parse(context.now))) fail('INVALID_CLOCK', 'Serverový čas nie je dostupný.');
    var m = actorMember(state, actor), p = copy(payload || {}), fingerprint = stable({ actor: m.id, command: command, payload: p });
    var cid = context.commandId ? commandId(context.commandId) : '';
    if (cid) { var previous = (state.dedup || []).find(function (x) { return x.id === cid; }); if (previous) { if (previous.fingerprint !== fingerprint) fail('COMMAND_REUSED', 'Identifikátor požiadavky už bol použitý pre inú zmenu.'); return { result: copy(previous.result), notifications: [], duplicate: true }; } }
    var next = copy(state), notices = [], result = null, times, day, row;
    if (command === 'attendanceSet') {
      if (!Array.isArray(p.dates) || !p.dates.length || p.dates.length > 30 || typeof p.office !== 'boolean' || (p.parking !== undefined && typeof p.parking !== 'boolean')) fail('INVALID_PAYLOAD', 'Vyberte dni dochádzky a stav parkovania.');
      if ((p.start !== undefined && (typeof p.start !== 'string' || !p.start)) || (p.end !== undefined && (typeof p.end !== 'string' || !p.end))) fail('INVALID_TIME', 'Zadajte platný čas dochádzky.');
      if (p.spaces !== undefined && (!p.spaces || typeof p.spaces !== 'object' || Array.isArray(p.spaces) || !p.office || p.parking !== true || p.spaceId !== undefined)) fail('INVALID_PAYLOAD', 'Vyberte platné miesta pre dni príchodu autom.');
      if (p.spaceId !== undefined && (!p.office || p.parking !== true)) fail('INVALID_PAYLOAD', 'Miesto môžete vybrať iba pri príchode autom.');
      if (p.spaceId !== undefined) parkingTargets(next, m, p.spaceId);
      var dates = p.dates.map(function (d) { return inWindow(d, context); }).filter(function (d, i, a) { return a.indexOf(d) === i; }), days = []; times = interval(p, next.config);
      if (p.spaces !== undefined) Object.keys(p.spaces).forEach(function (d) { if (dates.indexOf(d) < 0) fail('INVALID_PAYLOAD', 'Výber miesta nepatrí medzi vybrané dni.'); parkingTargets(next, m, p.spaces[d]); });
      dates.forEach(function (d) {
        var parkingDay = { date: d, status: 'officeOnly', start: times.start, end: times.end };
        if (!p.office || p.parking === false) {
          clearOwnWaiting(next, m, d);
          next.reservations = next.reservations.filter(function (x) { if (x.owner === m.id && x.date === d && !isFleet(x)) { notices.push(releaseNotice(x, next)); return false; } return true; });
        } else if (p.parking === true) parkingDay = autoParking(next, m, d, times, context, notices, p.spaces !== undefined && Object.prototype.hasOwnProperty.call(p.spaces, d) ? p.spaces[d] : p.spaceId);
        if (p.office) {
          var covering = { start: times.start, end: times.end }; next.reservations.filter(function (r) { return r.owner === m.id && r.date === d && !isFleet(r); }).forEach(function (r) { if (r.start < covering.start) covering.start = r.start; if (r.end > covering.end) covering.end = r.end; });
          next.attendance = next.attendance.filter(function (x) { return x.owner !== m.id || x.date !== d; }); ensureAttendance(next, m, d, covering);
        }
        else next.attendance = next.attendance.filter(function (x) { return x.owner !== m.id || x.date !== d; });
        days.push(parkingDay);
      }); result = { dates: dates, office: p.office }; if (p.parking !== undefined) { result.parking = p.parking; result.days = days; }
    } else if (command === 'reservationSave') {
      day = inWindow(p.date, context); times = interval(p, next.config);
      row = p.id ? next.reservations.find(function (x) { return x.id === p.id; }) : null;
      if (p.id) { own(row, m); inWindow(row.date, context); if (Number(p.revision) !== row.revision) fail('STALE', 'Rezervácia sa medzitým zmenila. Obnovte údaje.'); }
      var kind = reservationKind(p, row, m), guestName = kind === 'fleet' ? fleetName(p.name) : m.name, guestVehicle = kind === 'fleet' ? fleetVehicle(p.vehicle) : null;
      var spaceId = text(p.spaceId, 80); if (p.floor !== undefined) { if (Number(p.floor) !== -1 || (spaceId && slotFor(next, spaceId).floor !== -1)) fail('INVALID_SPACE', 'Vyberte platné parkovanie.'); var eligible = poolSlots(next).find(function (s) { return slotAllowed(s, m); }); if (!eligible) fail('RESTRICTED', 'Na parkovanie na −1 nemáte oprávnenie.'); spaceId = eligible.id; }
      var reservation = { id: row ? row.id : uniqueId(next, context, 'r'), revision: row ? row.revision + 1 : 1, date: day, owner: m.id, name: guestName, spaceId: spaceId, start: times.start, end: times.end };
      if (kind === 'fleet') { reservation.kind = 'fleet'; reservation.vehicle = guestVehicle; reservation.creatorName = m.name; }
      allocation(next, reservation, row ? [row.id] : []);
      if (row) { notices = notices.concat(freedIntervals(row, reservation, next)); next.reservations = next.reservations.filter(function (x) { return x.id !== row.id; }); }
      next.reservations.push(reservation); if (kind !== 'fleet') ensureAttendance(next, m, day, times); result = reservation;
    } else if (command === 'reservationCancel') {
      if (!Array.isArray(p.ids) || !p.ids.length || p.ids.length > 60) fail('INVALID_PAYLOAD', 'Vyberte rezervácie na zrušenie.');
      var ids = p.ids.filter(function (id, i, a) { return a.indexOf(id) === i; });
      ids.forEach(function (id) { var x = next.reservations.find(function (r) { return r.id === id; }), owner = x && next.members.find(function (u) { return u.id === x.owner; }); if (!(x && canAdmin(m) && owner && (owner.access === false || owner.active === false))) own(x, m); inWindow(x.date, context); notices.push(releaseNotice(x, next)); });
      next.reservations = next.reservations.filter(function (r) { return ids.indexOf(r.id) < 0; }); result = { ids: ids };
    } else if (command === 'offerCreate') {
      var fromId = p.fromReservationId || p.reservationId, toId = p.toReservationId || p.otherReservationId, to = login(p.to || p.recipient), recipient = member(next, to);
      if (!recipient || recipient.access === false || recipient.id === m.id) fail('INVALID_MEMBER', 'Vyberte iného aktívneho člena Garáže.');
      if (p.type !== 'transfer' && p.type !== 'swap') fail('INVALID_PAYLOAD', 'Vyberte odovzdanie alebo výmenu.');
      var fromReservation = next.reservations.find(function (r) { return r.id === fromId; }); own(fromReservation, m); inWindow(fromReservation.date, context);
      var other = null;
      if (p.type === 'swap') { other = next.reservations.find(function (r) { return r.id === toId; }); if (!other || other.owner !== to) fail('INVALID_OFFER', 'Vyberte rezerváciu adresáta výmeny.'); inWindow(other.date, context); }
      if (isFleet(fromReservation) || (other && isFleet(other))) fail('FORBIDDEN', 'Rezervácie ďalších áut nie je možné odovzdať ani vymeniť.');
      var expiresAt = p.expiresAt || new Date(Date.parse(context.now) + 7 * 86400000).toISOString();
      if (!isFinite(Date.parse(expiresAt)) || Date.parse(expiresAt) <= Date.parse(context.now) || Date.parse(expiresAt) > Date.parse(context.now) + 30 * 86400000) fail('INVALID_OFFER', 'Platnosť ponuky nie je platná.');
      result = { id: uniqueId(next, context, 'o'), type: p.type, from: m.id, to: to, fromReservationId: fromReservation.id, fromRevision: fromReservation.revision, toReservationId: other ? other.id : null, toRevision: other ? other.revision : null, status: 'pending', expiresAt: new Date(expiresAt).toISOString() }; next.offers.push(result);
      notices.push(Object.assign(releaseNotice(fromReservation, next), { type: 'offer', audience: [to], offerId: result.id }));
    } else if (command === 'offerRespond') {
      var offer = next.offers.find(function (o) { return o.id === p.id; }), response = p.response || p.decision;
      if (!offer) fail('NOT_FOUND', 'Ponuka už neexistuje.');
      if (response === 'cancel' ? offer.from !== m.id : offer.to !== m.id) fail('FORBIDDEN', 'Na túto ponuku nemôžete odpovedať.');
      if (offer.status !== 'pending') fail('STALE', 'Ponuka už bola vybavená.');
      if (['accept', 'decline', 'cancel'].indexOf(response) < 0) fail('INVALID_PAYLOAD', 'Vyberte odpoveď na ponuku.');
      if (response === 'accept') {
        if (Date.parse(offer.expiresAt) <= Date.parse(context.now)) fail('EXPIRED', 'Platnosť ponuky vypršala.');
        var first = next.reservations.find(function (r) { return r.id === offer.fromReservationId; }), second = offer.type === 'swap' ? next.reservations.find(function (r) { return r.id === offer.toReservationId; }) : null;
        if (!first || first.owner !== offer.from || first.revision !== offer.fromRevision || (offer.type === 'swap' && (!second || second.owner !== offer.to || second.revision !== offer.toRevision))) fail('STALE', 'Pôvodné rezervácie sa zmenili. Vytvorte novú ponuku.');
        if (isFleet(first) || (second && isFleet(second))) fail('FORBIDDEN', 'Rezervácie ďalších áut nie je možné odovzdať ani vymeniť.');
        inWindow(first.date, context); if (second) inWindow(second.date, context);
        var changed = [Object.assign({}, first, { owner: offer.to, name: m.name, revision: first.revision + 1 })];
        if (second) { var donor = member(next, offer.from); if (!donor || donor.access === false) fail('NOT_MEMBER', 'Odosielateľ už nie je aktívnym členom.'); changed.push(Object.assign({}, second, { owner: offer.from, name: donor.name, revision: second.revision + 1 })); }
        var ignored = changed.map(function (r) { return r.id; }); next.reservations = next.reservations.filter(function (r) { return ignored.indexOf(r.id) < 0; }).concat(changed); changed.forEach(function (r) { allocation(next, r, [r.id]); });
        if (changed.length > 1 && overlaps(changed[0], changed[1]) && (changed[0].owner === changed[1].owner || changed[0].spaceId === changed[1].spaceId)) fail('CONFLICT', 'Výmena by vytvorila prekrývajúce sa rezervácie.');
        changed.forEach(function (r) { ensureAttendance(next, member(next, r.owner), r.date, r); });
      }
      offer.status = response === 'accept' ? 'accepted' : response === 'decline' ? 'declined' : 'cancelled'; result = offer;
      var original = next.reservations.find(function (r) { return r.id === offer.fromReservationId; }); notices.push(Object.assign(original ? releaseNotice(original, next) : {}, { type: 'offer-' + offer.status, audience: [offer.from, offer.to], offerId: offer.id }));
    } else if (command === 'waitlistSet') {
      day = inWindow(p.date, context); if (typeof p.enabled !== 'boolean') fail('INVALID_PAYLOAD', 'Vyberte stav čakacej listiny.'); times = interval(p, next.config);
      next.waitlist = next.waitlist.filter(function (x) { return x.owner !== m.id || x.date !== day; }); result = { date: day, owner: m.id, start: times.start, end: times.end, enabled: p.enabled }; if (p.enabled) next.waitlist.push({ date: day, owner: m.id, start: times.start, end: times.end });
    } else if (command === 'configSave') {
      admin(m); var config = copy(next.config);
      if (p.defaultStart !== undefined) config.defaultStart = clock(p.defaultStart); if (p.defaultEnd !== undefined) config.defaultEnd = clock(p.defaultEnd); interval(config, config);
      if (p.workingDays !== undefined) { if (!Array.isArray(p.workingDays) || !p.workingDays.length || p.workingDays.some(function (x) { return !Number.isInteger(x) || x < 0 || x > 6; })) fail('INVALID_PAYLOAD', 'Pracovné dni nie sú platné.'); config.workingDays = p.workingDays.filter(function (x, i, a) { return a.indexOf(x) === i; }); }
      if (p.slots !== undefined) {
        if (!Array.isArray(p.slots) || !p.slots.length || p.slots.length > 100) fail('INVALID_PAYLOAD', 'Zadajte platné parkovacie miesta.');
        var seen = {}, numbers = {}; config.slots = p.slots.map(function (s, i) { var id = text(s.id, 80), floor = Number(s.floor), number = floor === -1 ? '' : text(s.number, 30), key = floor + '|' + number; if (!/^[a-zA-Z0-9_-]+$/.test(id) || seen[id] || (floor !== -1 && (!number || numbers[key])) || !Number.isInteger(floor) || Math.abs(floor) > 100) fail('INVALID_SPACE', 'Parkovacie miesto nie je platné.'); seen[id] = true; numbers[key] = true; var x = { id: id, number: number, floor: floor, order: Number.isFinite(Number(s.order)) ? Number(s.order) : i, active: s.active !== false }; if (s.allowedMembers) { if (!Array.isArray(s.allowedMembers)) fail('INVALID_PAYLOAD', 'Obmedzenie členov nie je platné.'); x.allowedMembers = s.allowedMembers.map(login); } if (s.allowedRoles) { if (!Array.isArray(s.allowedRoles) || s.allowedRoles.some(function (r) { return ROLES.indexOf(r) < 0; })) fail('INVALID_PAYLOAD', 'Obmedzenie rolí nie je platné.'); x.allowedRoles = s.allowedRoles.slice(); } return x; });
        if (config.slots.filter(function (s) { return s.floor === -1; }).length > 2) fail('INVALID_SPACE', 'Na −1 sú len dve parkovacie miesta.');
        next.reservations.concat(next.blocks).filter(function (r) { return r.date >= context.today; }).forEach(function (r) { var s = config.slots.find(function (x) { return x.id === r.spaceId && x.active; }), previousSlot = next.config.slots.find(function (x) { return x.id === r.spaceId; }); if (!s || (previousSlot && s.floor !== previousSlot.floor) || (r.owner && !slotAllowed(s, member(next, r.owner) || { id: r.owner, role: '' }))) fail('SLOT_IN_USE', 'Miesto má budúcu rezerváciu alebo blokáciu. Najprv ju zrušte.'); });
      }
      next.config = config; result = config;
    } else if (command === 'memberProfileSave') {
      if ((p.id && login(p.id) !== m.id) || (p.login && login(p.login) !== m.id)) fail('FORBIDDEN', 'Môžete upraviť iba svoje auto.');
      row = next.members.find(function (x) { return x.id === m.id; }); row.vehicle = vehicle(p.vehicle); result = { id: m.id, vehicle: row.vehicle };
    } else if (command === 'memberSave') {
      admin(m); var id = login(p.id || p.login), old = next.members.find(function (x) { return x.id === id; }), source = context.bindableMember;
      if (source && login(source.id) !== id) fail('INVALID_MEMBER', 'Zdrojový účet sa nezhoduje s vybraným členom.');
      var role = source ? source.role : p.role || (old && old.role) || 'office', weeklyDays = Number(source ? source.weeklyDays : p.weeklyDays === undefined ? (old ? old.weeklyDays : 0) : p.weeklyDays);
      if (ROLES.indexOf(role) < 0 || [0, 1, 2, 3, 4, 5].indexOf(weeklyDays) < 0 || (p.active !== undefined && typeof p.active !== 'boolean') || (p.access !== undefined && typeof p.access !== 'boolean')) fail('INVALID_MEMBER', 'Profil Garáže nie je platný.');
      if (m.role !== 'admin' && (p.role === 'admin' || role === 'admin' || (old && old.role === 'admin'))) fail('FORBIDDEN', 'Administrátorskú rolu môže nastaviť iba administrátor.');
      if (id === m.id && (p.active === false || p.access === false || role !== m.role)) fail('FORBIDDEN', 'Vlastné správcovské oprávnenie nemôžete zrušiť.');
      if (p.active === false && next.reservations.some(function (r) { return r.owner === id && r.date >= context.today; })) fail('MEMBER_IN_USE', 'Člen má dnešné alebo budúce parkovanie. Najprv musí zrušiť svoje rezervácie.');
      result = { id: id, name: text((source && source.name) || p.name || (old && old.name) || id, 120), role: role, weeklyDays: weeklyDays, active: p.active === undefined ? (p.access === true || !old || old.active !== false) : p.active, access: p.access === undefined ? (old ? old.access !== false : false) : p.access, sourceLine: (source && source.sourceLine) || p.sourceLine || (old && old.sourceLine) || 'gp', vehicle: vehicle(p.vehicle === undefined ? (old && old.vehicle) : p.vehicle) };
      next.members = next.members.filter(function (x) { return x.id !== id; }); next.members.push(result);
      if (old && old.role !== role) {
        try {
          var future = next.reservations.filter(function (r) { return r.owner === id && r.date >= context.today; }), poolDays = [];
          future.forEach(function (r) { var s = slotFor(next, r.spaceId); if (s.floor === -1) { if (poolDays.indexOf(r.date) < 0) poolDays.push(r.date); } else slotFor(next, r.spaceId, result); });
          poolDays.forEach(function (d) { var affected = future.filter(function (r) { return r.date === d && slotFor(next, r.spaceId).floor === -1; }); repackPool(next, d, affected, affected.map(function (r) { return r.id; })); });
        } catch (e) { fail('MEMBER_IN_USE', 'Zmena roly by porušila oprávnenia budúceho parkovania. Najprv musí člen upraviť svoje rezervácie.'); }
      }
    } else if (command === 'blockSave') {
      admin(m); day = inWindow(p.date, context); times = interval(p, next.config); slotFor(next, p.spaceId); row = p.id ? next.blocks.find(function (x) { return x.id === p.id; }) : null; if (p.id && !row) fail('NOT_FOUND', 'Blokácia už neexistuje.'); if (row) inWindow(row.date, context);
      var block = { id: row ? row.id : uniqueId(next, context, 'b'), date: day, spaceId: p.spaceId, start: times.start, end: times.end, reason: text(p.reason, 200) };
      if (slotFor(next, block.spaceId).floor !== -1 && next.reservations.concat(next.blocks).some(function (r) { return r.id !== block.id && r.spaceId === block.spaceId && overlaps(r, block); })) fail('CONFLICT', 'Blokácia sa prekrýva s rezerváciou alebo inou blokáciou.');
      var beforeBlocks = next.blocks; next.blocks = next.blocks.filter(function (x) { return x.id !== block.id; }); next.blocks.push(block); result = block;
      if (slotFor(next, block.spaceId).floor === -1) repackPool(next, day, [], []);
      if (row) notices = notices.concat(slotFor(next, row.spaceId).floor === -1 ? poolBlockReleases(row, beforeBlocks, next) : freedIntervals(row, block, next));
    } else if (command === 'blockDelete') {
      admin(m); row = next.blocks.find(function (x) { return x.id === p.id; }); if (!row) fail('NOT_FOUND', 'Blokácia už neexistuje.'); inWindow(row.date, context); var oldBlocks = next.blocks; next.blocks = next.blocks.filter(function (x) { return x.id !== row.id; }); notices = notices.concat(slotFor(next, row.spaceId).floor === -1 ? poolBlockReleases(row, oldBlocks, next) : [releaseNotice(row, next)]); result = { id: row.id };
    } else fail('UNKNOWN_COMMAND', 'Táto operácia nie je podporovaná.');
    next.version++; next.audit.push({ id: uniqueId(next, context, 'a'), actor: m.id, name: m.name, time: context.now, command: command, version: next.version }); next.audit = next.audit.slice(-1000);
    if (cid) { next.dedup = (next.dedup || []).concat([{ id: cid, fingerprint: fingerprint, result: copy(result), time: context.now }]).slice(-1000); }
    Object.keys(state).forEach(function (k) { delete state[k]; }); Object.keys(next).forEach(function (k) { state[k] = next[k]; });
    return { result: copy(result), notifications: notices, duplicate: false };
  }
  function snapshot(state, actor, context) {
    var m = actorMember(state, actor), w = windowFor(context.today), publicMember = function (x) { return { id: x.id, name: x.name, role: x.role, weeklyDays: Number(x.weeklyDays || 0), active: x.active !== false, access: x.access !== false, sourceLine: x.sourceLine || 'gp', vehicle: vehicle(x.vehicle) }; };
    var inRange = function (x) { return x.date >= w.start && x.date <= w.end; };
    var me = publicMember(m); me.canAdmin = canAdmin(m);
    return { ok: true, version: state.version, serverDate: context.today, window: w, me: me, config: copy(state.config), members: state.members.filter(function (x) { return x.active !== false || canAdmin(m); }).map(publicMember), attendance: copy(state.attendance.filter(inRange)), reservations: copy(state.reservations.filter(inRange)), offers: state.offers.filter(function (x) { return canAdmin(m) || x.from === m.id || x.to === m.id; }).map(function (x) { return { id: x.id, type: x.type, from: x.from, to: x.to, fromReservationId: x.fromReservationId, toReservationId: x.toReservationId, status: x.status === 'pending' && Date.parse(x.expiresAt) <= Date.parse(context.now) ? 'expired' : x.status, expiresAt: x.expiresAt }; }), waitlist: copy(state.waitlist.filter(inRange)), blocks: copy(state.blocks.filter(inRange)), audit: canAdmin(m) ? copy(state.audit.slice(-200)) : [] };
  }
  return { createState: createState, apply: apply, snapshot: snapshot, windowFor: windowFor, validateCommandId: commandId, migrateLayout: migrateLayout, layoutNeedsMigration: layoutNeedsMigration, poolAvailability: poolAvailability, attendanceParkingChoices: attendanceParkingChoices };
}());
if (typeof module !== 'undefined' && module.exports) module.exports = SatoriGarageModel;
