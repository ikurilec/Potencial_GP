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
  function vehicle(value) { var v = value || {}, brand = String(v.brand || '').trim(), color = String(v.color || '#64748b').toLowerCase(); if (brand.length > 60 || /[\u0000-\u001f\u007f]/.test(brand) || !/^#[0-9a-f]{6}$/.test(color)) fail('INVALID_VEHICLE', 'Zadajte značku auta do 60 znakov a platnú farbu.'); return { brand: brand, color: color }; }
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
  function actorMember(state, actor) { var m = member(state, login(actor && actor.id)); if (!m) fail('NOT_MEMBER', 'Nemáte aktívny prístup do Garáže.'); return m; }
  function canAdmin(m) { return m.role === 'admin' || m.role === 'fleet'; }
  function admin(m) { if (!canAdmin(m)) fail('FORBIDDEN', 'Túto zmenu môže urobiť iba správca Garáže.'); }
  function own(row, m) { if (!row) fail('NOT_FOUND', 'Záznam už neexistuje. Obnovte údaje.'); if (row.owner !== m.id) fail('FORBIDDEN', 'Môžete upraviť iba svoje záznamy.'); }
  function slotAllowed(slot, m) { return (!slot.allowedMembers || !slot.allowedMembers.length || slot.allowedMembers.indexOf(m.id) >= 0) && (!slot.allowedRoles || !slot.allowedRoles.length || slot.allowedRoles.indexOf(m.role) >= 0); }
  function slotFor(state, id, m) { var slot = state.config.slots.find(function (s) { return s.id === id && s.active; }); if (!slot) fail('INVALID_SPACE', 'Parkovacie miesto nie je dostupné.'); if (m && !slotAllowed(slot, m)) fail('RESTRICTED', 'Na toto parkovacie miesto nemáte oprávnenie.'); return slot; }
  function allocation(state, r, ignore) {
    var m = member(state, r.owner); if (!m) fail('NOT_MEMBER', 'Príjemca nemá aktívny prístup do Garáže.'); slotFor(state, r.spaceId, m);
    if (state.reservations.some(function (x) { return ignore.indexOf(x.id) < 0 && overlaps(x, r) && (x.spaceId === r.spaceId || x.owner === r.owner); }) || state.blocks.some(function (b) { return b.spaceId === r.spaceId && overlaps(b, r); })) fail('CONFLICT', 'Miesto alebo osoba má v tomto čase inú rezerváciu.');
  }
  function uniqueId(state, context, prefix) { var used = state.reservations.concat(state.offers, state.blocks, state.audit); for (var i = 0; i < 20; i++) { var v = prefix + '-' + String(context.id ? context.id() : state.version + '-' + i); if (!used.some(function (x) { return x.id === v; })) return v; } fail('ID_FAILURE', 'Záznam sa nepodarilo vytvoriť. Skúste znova.'); }
  function ensureAttendance(state, m, day, times) {
    var row = state.attendance.find(function (x) { return x.owner === m.id && x.date === day; });
    if (!row) { row = { date: day, owner: m.id, name: m.name, start: times.start, end: times.end }; state.attendance.push(row); }
    else { row.start = row.start < times.start ? row.start : times.start; row.end = row.end > times.end ? row.end : times.end; }
  }
  function releaseNotice(row, state) { var s = state.config.slots.find(function (x) { return x.id === row.spaceId; }); return { type: 'release', audience: 'all', date: row.date, spaceId: row.spaceId, number: s ? s.number : row.spaceId, floor: s ? s.floor : null, start: row.start, end: row.end }; }
  function freedIntervals(previous, replacement, state) {
    if (!replacement || previous.date !== replacement.date || previous.spaceId !== replacement.spaceId || !overlaps(previous, replacement)) return [releaseNotice(previous, state)];
    var out = []; if (previous.start < replacement.start) out.push(releaseNotice(Object.assign({}, previous, { end: replacement.start < previous.end ? replacement.start : previous.end }), state)); if (replacement.end < previous.end) out.push(releaseNotice(Object.assign({}, previous, { start: replacement.end > previous.start ? replacement.end : previous.start }), state)); return out;
  }
  function stable(value) { if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']'; if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(function (k) { return JSON.stringify(k) + ':' + stable(value[k]); }).join(',') + '}'; return JSON.stringify(value); }
  function commandId(value) { if (!/^[A-Za-z0-9][A-Za-z0-9_.:-]{7,127}$/.test(String(value || ''))) fail('INVALID_COMMAND_ID', 'Požiadavka nemá platný identifikátor. Skúste znova.'); return String(value); }
  function createState() {
    var slots = [];
    for (var i = 1; i <= 8; i++) slots.push({ id: (i <= 6 ? 'b3-' : 'b1-') + i, number: String(i), floor: i <= 6 ? -3 : -1, order: i - 1, active: true });
    return { schema: 1, version: 1, config: { slots: slots, defaultStart: '08:00', defaultEnd: '16:30', workingDays: [1, 2, 3, 4, 5] }, members: [], attendance: [], reservations: [], offers: [], waitlist: [], blocks: [], audit: [], dedup: [], outbox: [] };
  }
  function apply(state, actor, command, payload, context) {
    context = context || {}; windowFor(context.today);
    if (!context.now || !isFinite(Date.parse(context.now))) fail('INVALID_CLOCK', 'Serverový čas nie je dostupný.');
    var m = actorMember(state, actor), p = copy(payload || {}), fingerprint = stable({ actor: m.id, command: command, payload: p });
    var cid = context.commandId ? commandId(context.commandId) : '';
    if (cid) { var previous = (state.dedup || []).find(function (x) { return x.id === cid; }); if (previous) { if (previous.fingerprint !== fingerprint) fail('COMMAND_REUSED', 'Identifikátor požiadavky už bol použitý pre inú zmenu.'); return { result: copy(previous.result), notifications: [], duplicate: true }; } }
    var next = copy(state), notices = [], result = null, times, day, row;
    if (command === 'attendanceSet') {
      if (!Array.isArray(p.dates) || !p.dates.length || p.dates.length > 30 || typeof p.office !== 'boolean') fail('INVALID_PAYLOAD', 'Vyberte dni dochádzky.');
      var dates = p.dates.map(function (d) { return inWindow(d, context); }).filter(function (d, i, a) { return a.indexOf(d) === i; }); times = interval(p, next.config);
      dates.forEach(function (d) {
        if (p.office) {
          var covering = { start: times.start, end: times.end }; next.reservations.filter(function (r) { return r.owner === m.id && r.date === d; }).forEach(function (r) { if (r.start < covering.start) covering.start = r.start; if (r.end > covering.end) covering.end = r.end; });
          next.attendance = next.attendance.filter(function (x) { return x.owner !== m.id || x.date !== d; }); ensureAttendance(next, m, d, covering);
        }
        else { next.attendance = next.attendance.filter(function (x) { return x.owner !== m.id || x.date !== d; }); next.reservations = next.reservations.filter(function (x) { if (x.owner === m.id && x.date === d) { notices.push(releaseNotice(x, next)); return false; } return true; }); }
      }); result = { dates: dates, office: p.office };
    } else if (command === 'reservationSave') {
      day = inWindow(p.date, context); times = interval(p, next.config);
      row = p.id ? next.reservations.find(function (x) { return x.id === p.id; }) : null;
      if (p.id) { own(row, m); inWindow(row.date, context); if (Number(p.revision) !== row.revision) fail('STALE', 'Rezervácia sa medzitým zmenila. Obnovte údaje.'); }
      var reservation = { id: row ? row.id : uniqueId(next, context, 'r'), revision: row ? row.revision + 1 : 1, date: day, owner: m.id, name: m.name, spaceId: text(p.spaceId, 80), start: times.start, end: times.end };
      allocation(next, reservation, row ? [row.id] : []);
      if (row) { notices = notices.concat(freedIntervals(row, reservation, next)); next.reservations = next.reservations.filter(function (x) { return x.id !== row.id; }); }
      next.reservations.push(reservation); ensureAttendance(next, m, day, times); result = reservation;
    } else if (command === 'reservationCancel') {
      if (!Array.isArray(p.ids) || !p.ids.length || p.ids.length > 60) fail('INVALID_PAYLOAD', 'Vyberte rezervácie na zrušenie.');
      var ids = p.ids.filter(function (id, i, a) { return a.indexOf(id) === i; });
      ids.forEach(function (id) { var x = next.reservations.find(function (r) { return r.id === id; }); own(x, m); inWindow(x.date, context); notices.push(releaseNotice(x, next)); });
      next.reservations = next.reservations.filter(function (r) { return ids.indexOf(r.id) < 0; }); result = { ids: ids };
    } else if (command === 'offerCreate') {
      var fromId = p.fromReservationId || p.reservationId, toId = p.toReservationId || p.otherReservationId, to = login(p.to || p.recipient), recipient = member(next, to);
      if (!recipient || recipient.id === m.id) fail('INVALID_MEMBER', 'Vyberte iného aktívneho člena Garáže.');
      if (p.type !== 'transfer' && p.type !== 'swap') fail('INVALID_PAYLOAD', 'Vyberte odovzdanie alebo výmenu.');
      var fromReservation = next.reservations.find(function (r) { return r.id === fromId; }); own(fromReservation, m); inWindow(fromReservation.date, context);
      var other = null;
      if (p.type === 'swap') { other = next.reservations.find(function (r) { return r.id === toId; }); if (!other || other.owner !== to) fail('INVALID_OFFER', 'Vyberte rezerváciu adresáta výmeny.'); inWindow(other.date, context); }
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
        inWindow(first.date, context); if (second) inWindow(second.date, context);
        var changed = [Object.assign({}, first, { owner: offer.to, name: m.name, revision: first.revision + 1 })];
        if (second) { var donor = member(next, offer.from); if (!donor) fail('NOT_MEMBER', 'Odosielateľ už nie je aktívnym členom.'); changed.push(Object.assign({}, second, { owner: offer.from, name: donor.name, revision: second.revision + 1 })); }
        var ignored = changed.map(function (r) { return r.id; }); changed.forEach(function (r) { allocation(next, r, ignored); });
        if (changed.length > 1 && overlaps(changed[0], changed[1]) && (changed[0].owner === changed[1].owner || changed[0].spaceId === changed[1].spaceId)) fail('CONFLICT', 'Výmena by vytvorila prekrývajúce sa rezervácie.');
        next.reservations = next.reservations.filter(function (r) { return ignored.indexOf(r.id) < 0; }).concat(changed); changed.forEach(function (r) { ensureAttendance(next, member(next, r.owner), r.date, r); });
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
        var seen = {}; config.slots = p.slots.map(function (s, i) { var id = text(s.id, 80); if (!/^[a-zA-Z0-9_-]+$/.test(id) || seen[id] || !text(s.number, 30) || !Number.isInteger(Number(s.floor)) || Math.abs(Number(s.floor)) > 100) fail('INVALID_SPACE', 'Parkovacie miesto nie je platné.'); seen[id] = true; var x = { id: id, number: text(s.number, 30), floor: Number(s.floor), order: Number.isFinite(Number(s.order)) ? Number(s.order) : i, active: s.active !== false }; if (s.allowedMembers) { if (!Array.isArray(s.allowedMembers)) fail('INVALID_PAYLOAD', 'Obmedzenie členov nie je platné.'); x.allowedMembers = s.allowedMembers.map(login); } if (s.allowedRoles) { if (!Array.isArray(s.allowedRoles) || s.allowedRoles.some(function (r) { return ROLES.indexOf(r) < 0; })) fail('INVALID_PAYLOAD', 'Obmedzenie rolí nie je platné.'); x.allowedRoles = s.allowedRoles.slice(); } return x; });
        next.reservations.concat(next.blocks).filter(function (r) { return r.date >= context.today; }).forEach(function (r) { var s = config.slots.find(function (x) { return x.id === r.spaceId && x.active; }); if (!s || (r.owner && !slotAllowed(s, member(next, r.owner) || { id: r.owner, role: '' }))) fail('SLOT_IN_USE', 'Miesto má budúcu rezerváciu alebo blokáciu. Najprv ju zrušte.'); });
      }
      next.config = config; result = config;
    } else if (command === 'memberProfileSave') {
      if ((p.id && login(p.id) !== m.id) || (p.login && login(p.login) !== m.id)) fail('FORBIDDEN', 'Môžete upraviť iba svoje auto.');
      row = next.members.find(function (x) { return x.id === m.id; }); row.vehicle = vehicle(p.vehicle); result = { id: m.id, vehicle: row.vehicle };
    } else if (command === 'memberSave') {
      admin(m); var id = login(p.id || p.login), old = next.members.find(function (x) { return x.id === id; }), role = p.role || (old && old.role) || 'office', weeklyDays = Number(p.weeklyDays === undefined ? (old ? old.weeklyDays : 0) : p.weeklyDays);
      if (ROLES.indexOf(role) < 0 || [0, 3, 4].indexOf(weeklyDays) < 0 || (p.active !== undefined && typeof p.active !== 'boolean')) fail('INVALID_MEMBER', 'Profil Garáže nie je platný.');
      if (m.role !== 'admin' && (role === 'admin' || (old && old.role === 'admin'))) fail('FORBIDDEN', 'Administrátorskú rolu môže nastaviť iba administrátor.');
      if (id === m.id && (p.active === false || role !== m.role)) fail('FORBIDDEN', 'Vlastné správcovské oprávnenie nemôžete zrušiť.');
      if (p.active === false && next.reservations.some(function (r) { return r.owner === id && r.date >= context.today; })) fail('MEMBER_IN_USE', 'Člen má dnešné alebo budúce parkovanie. Najprv musí zrušiť svoje rezervácie.');
      result = { id: id, name: text((context.bindableMember && context.bindableMember.name) || p.name || (old && old.name) || id, 120), role: role, weeklyDays: weeklyDays, active: p.active !== false, sourceLine: (context.bindableMember && context.bindableMember.sourceLine) || p.sourceLine || (old && old.sourceLine) || 'gp', vehicle: vehicle(p.vehicle === undefined ? (old && old.vehicle) : p.vehicle) };
      next.members = next.members.filter(function (x) { return x.id !== id; }); next.members.push(result);
    } else if (command === 'blockSave') {
      admin(m); day = inWindow(p.date, context); times = interval(p, next.config); slotFor(next, p.spaceId); row = p.id ? next.blocks.find(function (x) { return x.id === p.id; }) : null; if (p.id && !row) fail('NOT_FOUND', 'Blokácia už neexistuje.'); if (row) inWindow(row.date, context);
      var block = { id: row ? row.id : uniqueId(next, context, 'b'), date: day, spaceId: p.spaceId, start: times.start, end: times.end, reason: text(p.reason, 200) };
      if (next.reservations.concat(next.blocks).some(function (r) { return r.id !== block.id && r.spaceId === block.spaceId && overlaps(r, block); })) fail('CONFLICT', 'Blokácia sa prekrýva s rezerváciou alebo inou blokáciou.');
      if (row) notices = notices.concat(freedIntervals(row, block, next)); next.blocks = next.blocks.filter(function (x) { return x.id !== block.id; }); next.blocks.push(block); result = block;
    } else if (command === 'blockDelete') {
      admin(m); row = next.blocks.find(function (x) { return x.id === p.id; }); if (!row) fail('NOT_FOUND', 'Blokácia už neexistuje.'); inWindow(row.date, context); next.blocks = next.blocks.filter(function (x) { return x.id !== row.id; }); notices.push(releaseNotice(row, next)); result = { id: row.id };
    } else fail('UNKNOWN_COMMAND', 'Táto operácia nie je podporovaná.');
    next.version++; next.audit.push({ id: uniqueId(next, context, 'a'), actor: m.id, name: m.name, time: context.now, command: command, version: next.version }); next.audit = next.audit.slice(-1000);
    if (cid) { next.dedup = (next.dedup || []).concat([{ id: cid, fingerprint: fingerprint, result: copy(result), time: context.now }]).slice(-1000); }
    Object.keys(state).forEach(function (k) { delete state[k]; }); Object.keys(next).forEach(function (k) { state[k] = next[k]; });
    return { result: copy(result), notifications: notices, duplicate: false };
  }
  function snapshot(state, actor, context) {
    var m = actorMember(state, actor), w = windowFor(context.today), publicMember = function (x) { return { id: x.id, name: x.name, role: x.role, weeklyDays: Number(x.weeklyDays || 0), active: x.active !== false, sourceLine: x.sourceLine || 'gp', vehicle: vehicle(x.vehicle) }; };
    var inRange = function (x) { return x.date >= w.start && x.date <= w.end; };
    var me = publicMember(m); me.canAdmin = canAdmin(m);
    return { ok: true, version: state.version, serverDate: context.today, window: w, me: me, config: copy(state.config), members: state.members.filter(function (x) { return x.active !== false || canAdmin(m); }).map(publicMember), attendance: copy(state.attendance.filter(inRange)), reservations: copy(state.reservations.filter(inRange)), offers: state.offers.filter(function (x) { return canAdmin(m) || x.from === m.id || x.to === m.id; }).map(function (x) { return { id: x.id, type: x.type, from: x.from, to: x.to, fromReservationId: x.fromReservationId, toReservationId: x.toReservationId, status: x.status === 'pending' && Date.parse(x.expiresAt) <= Date.parse(context.now) ? 'expired' : x.status, expiresAt: x.expiresAt }; }), waitlist: copy(state.waitlist.filter(inRange)), blocks: copy(state.blocks.filter(inRange)), audit: canAdmin(m) ? copy(state.audit.slice(-200)) : [] };
  }
  return { createState: createState, apply: apply, snapshot: snapshot, windowFor: windowFor, validateCommandId: commandId };
}());
if (typeof module !== 'undefined' && module.exports) module.exports = SatoriGarageModel;
