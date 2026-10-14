/* Pure physical availability. Text values are data: callers must escape them when rendering HTML. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root, require('./garage-model.js'));
  else root.SatoriGarageAvailability = factory(root, null);
}(typeof window !== 'undefined' ? window : globalThis, function (root, nodeModel) {
  'use strict';
  function unknown() { return { known: false, capacity: null, available: null, partial: false, places: [] }; }
  function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    var parsed = Date.parse(value + 'T00:00:00Z');
    return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === value;
  }
  function validClock(value) { return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value); }
  function validInterval(value) { return value && typeof value === 'object' && !Array.isArray(value) && validClock(value.start) && validClock(value.end) && value.start < value.end; }
  function overlap(row, interval) { return row.start < interval.end && interval.start < row.end; }
  function isPartial(rows, interval) { return rows.some(function (r) { return overlap(r, interval) && (r.start > interval.start || r.end < interval.end); }); }
  function booked(row) {
    var result = { name: typeof row.name === 'string' ? row.name : '', start: row.start, end: row.end };
    if (row.kind) result.kind = row.kind;
    return result;
  }
  function blocked(row) { return { start: row.start, end: row.end, reason: typeof row.reason === 'string' ? row.reason : '' }; }
  function orderRows(a, b) { return a.start.localeCompare(b.start) || a.end.localeCompare(b.end); }
  // Merge a copy, including touching intervals. Never edit snapshot rows.
  function union(rows, interval) {
    var spans = rows.filter(function (r) { return overlap(r, interval); }).map(function (r) {
      return { start: r.start < interval.start ? interval.start : r.start, end: r.end > interval.end ? interval.end : r.end };
    }).sort(orderRows), merged = [];
    spans.forEach(function (r) {
      var previous = merged[merged.length - 1];
      if (previous && r.start <= previous.end) { if (r.end > previous.end) previous.end = r.end; }
      else merged.push(r);
    });
    return merged;
  }
  function numberedWindows(rows, interval) {
    var held = union(rows, interval), windows = [], cursor = interval.start;
    held.forEach(function (r) { if (cursor < r.start) windows.push({ start: cursor, end: r.start, available: 1 }); cursor = r.end; });
    if (cursor < interval.end) windows.push({ start: cursor, end: interval.end, available: 1 });
    return windows;
  }
  // One physical-capacity sweep over change points. Unlike running model
  // allocation at every point, this does not repeatedly deep-copy the snapshot.
  function pooledWindows(rows, blocksByUnit, capacity, interval) {
    var changes = new Map(); changes.set(interval.start, 0); changes.set(interval.end, 0);
    function change(time, delta) { changes.set(time, (changes.get(time) || 0) + delta); }
    function add(row) {
      if (!overlap(row, interval)) return;
      change(row.start < interval.start ? interval.start : row.start, 1);
      change(row.end > interval.end ? interval.end : row.end, -1);
    }
    rows.forEach(add);
    blocksByUnit.forEach(function (blocks) { union(blocks, interval).forEach(add); });
    var points = Array.from(changes.keys()).sort(), occupied = 0, windows = [];
    for (var i = 0; i < points.length - 1; i++) {
      occupied += changes.get(points[i]);
      var available = Math.max(0, capacity - occupied), last = windows[windows.length - 1];
      if (!available) continue;
      if (last && last.end === points[i] && last.available === available) last.end = points[i + 1];
      else windows.push({ start: points[i], end: points[i + 1], available: available });
    }
    return windows;
  }
  /**
   * day(snapshot, 'YYYY-MM-DD', {start:'HH:mm', end:'HH:mm'})
   * available counts places free for the WHOLE chosen interval. Numbered bays
   * have capacity 1; pool--1 aggregates anonymous physical capacity (0–2).
   * freeWindows list only positive availability, clamped to the chosen interval;
   * bookings/blocks list actual unclipped hours of every record for that day.
   * Unknown bounds, malformed data or invalid intervals return null counts.
   * This is information only: it grants no reservation permission.
   */
  function day(snapshot, date, requested) {
    if (!snapshot || typeof snapshot !== 'object' || !validDate(date)) return unknown();
    var config = snapshot.config, bounds = snapshot.window;
    if (!config || !bounds || !validDate(bounds.start) || !validDate(bounds.end) || bounds.start > bounds.end || date < bounds.start || date > bounds.end) return unknown();
    if (snapshot.serverDate !== undefined) {
      if (!validDate(snapshot.serverDate)) return unknown();
      var rollingEnd = new Date(Date.parse(snapshot.serverDate + 'T00:00:00Z') + 29 * 86400000).toISOString().slice(0, 10);
      if (date < snapshot.serverDate || date > rollingEnd) return unknown();
    }
    var interval = requested === undefined ? { start: config.defaultStart || '08:00', end: config.defaultEnd || '16:30' } : requested;
    if (!validInterval(interval) || !Array.isArray(snapshot.reservations) || !Array.isArray(snapshot.blocks)) return unknown();
    var slots = Array.isArray(config.slots) ? config.slots : Array.isArray(config.activeSlots) ? config.activeSlots.map(function (s) {
      return s && s.active === undefined ? Object.assign({ active: true }, s) : s;
    }) : null;
    if (!Array.isArray(slots)) return unknown();
    var ids = new Set(), slotById = new Map(), active = [], poolSlots = [], allPoolIds = new Set();
    for (var i = 0; i < slots.length; i++) {
      var slot = slots[i];
      if (!slot || typeof slot.id !== 'string' || !slot.id || ids.has(slot.id) || !Number.isInteger(slot.floor)) return unknown();
      ids.add(slot.id); slotById.set(slot.id, slot);
      if (slot.floor === -1) allPoolIds.add(slot.id);
      if (slot.active !== false) { active.push(slot); if (slot.floor === -1) poolSlots.push(slot); }
    }
    if (poolSlots.length > 2) return unknown();
    active.sort(function (a, b) { return (Number(a.order) || 0) - (Number(b.order) || 0); });
    var reservations = [], blocks = [], byPlace = new Map(), blocksByPlace = new Map(), poolRows = [];
    function group(map, row) { if (!map.has(row.spaceId)) map.set(row.spaceId, []); map.get(row.spaceId).push(row); }
    for (i = 0; i < snapshot.reservations.length; i++) {
      var row = snapshot.reservations[i];
      if (!row || row.date !== date) continue;
      var source = slotById.get(row.spaceId);
      if (!source || (source.active === false && source.floor !== -1)) continue;
      if (!validInterval(row)) return unknown();
      reservations.push(row); group(byPlace, row); if (allPoolIds.has(row.spaceId)) poolRows.push(row);
    }
    for (i = 0; i < snapshot.blocks.length; i++) {
      row = snapshot.blocks[i];
      if (!row || row.date !== date) continue;
      source = slotById.get(row.spaceId);
      if (!source || source.active === false) continue;
      if (!validInterval(row)) return unknown();
      blocks.push(row); group(blocksByPlace, row);
    }
    var places = [], availableTotal = 0, partial = false;
    active.filter(function (s) { return s.floor !== -1; }).forEach(function (s) {
      var bookings = (byPlace.get(s.id) || []).slice().sort(orderRows), held = (blocksByPlace.get(s.id) || []).slice().sort(orderRows), occupied = bookings.concat(held), whole = !occupied.some(function (r) { return overlap(r, interval); }), partly = isPartial(occupied, interval);
      places.push({ id: s.id, number: s.number || '', floor: s.floor, label: s.label || 'Miesto ' + (s.number || s.id), capacity: 1, available: whole ? 1 : 0, partial: partly, availableWholeInterval: whole, bookings: bookings.map(booked), blocks: held.map(blocked), freeWindows: numberedWindows(occupied, interval) });
      if (whole) availableTotal++; if (partly) partial = true;
    });
    if (poolSlots.length) {
      var model = nodeModel || root.SatoriGarageModel;
      if (!model || typeof model.poolAvailability !== 'function' || !snapshot.me || !Array.isArray(snapshot.members)) return unknown();
      // Model keeps role restrictions, revoked owners, guest extra cars and
      // repacking authoritative. Numeric available is physical capacity;
      // canReserve additionally checks this actor's permissions/own bookings.
      var state = { config: Object.assign({}, config, { slots: slots }), members: snapshot.members, me: snapshot.me, reservations: reservations, blocks: blocks };
      if (snapshot.serverDate) state.serverDate = snapshot.serverDate;
      var preview = model.poolAvailability(state, { id: snapshot.me.id }, { date: date, start: interval.start, end: interval.end });
      if (!preview || !Number.isFinite(preview.available) || preview.capacity !== poolSlots.length || (preview.code && ['CONFLICT', 'RESTRICTED'].indexOf(preview.code) < 0)) return unknown();
      var poolBlocks = [], units = new Map();
      poolSlots.forEach(function (s) { var rows = blocksByPlace.get(s.id) || []; units.set(s.id, rows); poolBlocks = poolBlocks.concat(rows); });
      poolRows.sort(orderRows); poolBlocks.sort(orderRows);
      var poolPartial = isPartial(poolRows.concat(poolBlocks), interval);
      places.push({ id: 'pool--1', number: '', floor: -1, label: 'Parkovanie na −1', capacity: poolSlots.length, available: preview.available, partial: poolPartial, availableWholeInterval: preview.available > 0, bookings: poolRows.map(booked), blocks: poolBlocks.map(blocked), freeWindows: pooledWindows(poolRows, units, poolSlots.length, interval) });
      availableTotal += preview.available; if (poolPartial) partial = true;
    }
    // The clock describes the ORIGINAL reservation duration for this day,
    // independently of the displayed interval. Blocks never count as arrivals.
    var shortReservation = places.some(function (place) { return place.bookings.some(function (row) {
      var duration=(Number(row.end.slice(0,2))*60+Number(row.end.slice(3)))-(Number(row.start.slice(0,2))*60+Number(row.start.slice(3)));
      return duration>0 && duration<=240;
    }); });
    return { known: true, capacity: active.length, available: availableTotal, partial: partial, shortReservation: shortReservation, places: places };
  }
  return { day: day };
}));
