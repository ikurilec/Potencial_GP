/* Satori Garage: native hour/minute scroll wheels, independent of the parent render. */
(function (global) {
  'use strict';
  var ROW_HEIGHT = 40;
  var state = null;
  var STYLE_ID = 'garage-time-picker-style';

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
#garage-time-picker{position:fixed;inset:0;z-index:6100;display:flex;align-items:center;justify-content:center;padding:calc(env(safe-area-inset-top,0px) + 16px) 12px calc(env(safe-area-inset-bottom,0px) + 16px);background:rgba(12,30,53,.6);backdrop-filter:blur(4px);font-family:var(--font-body,sans-serif);color:var(--color-text,#334155);overscroll-behavior:none;touch-action:none;box-sizing:border-box}
#garage-time-picker *{box-sizing:border-box}
#garage-time-picker .garage-time-dialog{width:100%;max-width:360px;max-height:100%;overflow-y:auto;padding:var(--space-5,20px);background:var(--color-surface,#fff);border-radius:var(--radius-xl,20px);box-shadow:var(--shadow-xl,0 24px 48px rgba(12,30,53,.25));overscroll-behavior:contain}
#garage-time-picker .garage-time-title{font-family:var(--font-display,sans-serif);font-size:17px;font-weight:800;line-height:1.3;color:var(--color-navy,#0c1e35);margin:0;overflow-wrap:anywhere}
#garage-time-picker .garage-time-value{font-family:var(--font-display,sans-serif);font-size:30px;font-weight:800;line-height:1.3;font-variant-numeric:tabular-nums;color:var(--color-navy,#0c1e35);text-align:center;margin:16px 0 12px}
#garage-time-picker .garage-time-labels{display:grid;grid-template-columns:1fr 1fr;gap:16px;text-align:center;font-size:12px;font-weight:600;color:var(--color-text-muted,#64748b);margin-bottom:8px}
#garage-time-picker .garage-time-wheels{position:relative;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;border-radius:var(--radius-md,12px);isolation:isolate}
#garage-time-picker .garage-time-band{position:absolute;top:80px;left:0;right:0;height:40px;border-radius:var(--radius-md,12px);background:#eff6ff;border:1px solid #bfdbfe;pointer-events:none;z-index:-1}
#garage-time-picker .garage-time-wheel{height:200px;overflow-x:hidden;overflow-y:auto;padding:80px 0;scroll-snap-type:y mandatory;scrollbar-width:none;overscroll-behavior:contain;touch-action:pan-y;-webkit-overflow-scrolling:touch;outline-offset:2px;border-radius:var(--radius-md,12px)}
#garage-time-picker .garage-time-wheel::-webkit-scrollbar{display:none}
#garage-time-picker .garage-time-option{height:40px;min-height:40px;display:flex;align-items:center;justify-content:center;scroll-snap-align:center;font-family:var(--font-display,sans-serif);font-size:24px;font-weight:600;line-height:40px;font-variant-numeric:tabular-nums;color:var(--color-text-muted,#64748b);cursor:pointer;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}
#garage-time-picker .garage-time-option[aria-selected="true"]{color:var(--color-primary-dark,#1e40af);font-weight:800}
#garage-time-picker .garage-time-wheels::before,#garage-time-picker .garage-time-wheels::after{content:'';position:absolute;left:0;right:0;height:65px;pointer-events:none;z-index:1;border-radius:var(--radius-md,12px)}
#garage-time-picker .garage-time-wheels::before{top:0;background:linear-gradient(to bottom,var(--color-surface,#fff),rgba(255,255,255,0))}
#garage-time-picker .garage-time-wheels::after{bottom:0;background:linear-gradient(to top,var(--color-surface,#fff),rgba(255,255,255,0))}
#garage-time-picker .garage-time-actions{display:flex;gap:8px;margin-top:20px}
#garage-time-picker .garage-time-actions button{flex:1;min-width:0;min-height:44px;border:0;border-radius:var(--radius-md,12px);padding:12px;font-family:var(--font-display,sans-serif);font-size:13px;font-weight:700;line-height:1.4;color:#fff;background:linear-gradient(180deg,#3b82f6,var(--color-primary,#2563eb),var(--color-primary-dark,#1e40af));box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 4px 12px rgba(37,99,235,.2);cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:transform var(--t-fast,.12s)}
#garage-time-picker .garage-time-actions [data-time-cancel]{background:#eff6ff;color:var(--color-primary-dark,#1e40af);border:1px solid #bfdbfe;box-shadow:none}
#garage-time-picker button:active{transform:scale(.97)}
#garage-time-picker button:focus-visible,#garage-time-picker .garage-time-wheel:focus-visible{outline:3px solid var(--color-primary,#2563eb);outline-offset:3px}
@media(max-width:559px){#garage-time-picker .garage-time-dialog{padding:var(--space-4,16px)}}
@media(prefers-reduced-motion:reduce){#garage-time-picker *,#garage-time-picker *::before,#garage-time-picker *::after{transition:none!important;animation:none!important;scroll-behavior:auto!important}}
`;
    document.head.appendChild(style);
  }

  function twoDigits(value) { return String(value).padStart(2, '0'); }
  function indexAt(wheel) { return Math.max(0, Math.min(wheel.count - 1, Math.round(wheel.element.scrollTop / ROW_HEIGHT))); }
  function readValue(current) { return current.wheels.map(function (wheel) { return twoDigits(indexAt(wheel)); }).join(':'); }
  function active(current) {
    if (state !== current) return false;
    try { return !current.options.isActive || current.options.isActive(); }
    catch (_) { return false; }
  }
  function guard(current) {
    if (active(current)) return true;
    if (state === current) close();
    return false;
  }
  function listen(current, element, type, handler, options) {
    element.addEventListener(type, handler, options);
    current.dispose.push(function () { element.removeEventListener(type, handler, options); });
  }
  function update(current) {
    current.wheels.forEach(function (wheel) {
      var index = indexAt(wheel);
      if (wheel.selected !== index) {
        if (wheel.selected !== undefined) wheel.element.children[wheel.selected].setAttribute('aria-selected', 'false');
        wheel.element.children[index].setAttribute('aria-selected', 'true');
        wheel.selected = index;
      }
      wheel.element.setAttribute('aria-activedescendant', wheel.element.children[index].id);
    });
    var value = readValue(current);
    if (current.live.textContent !== value) current.live.textContent = value;
  }
  function align(wheel, index, smooth) {
    var reduceMotion = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    wheel.element.scrollTo({ top: Math.max(0, Math.min(wheel.count - 1, index)) * ROW_HEIGHT, behavior: smooth && !reduceMotion ? 'smooth' : 'auto' });
  }
  function focusables(current) {
    return [current.wheels[0].element, current.wheels[1].element, current.cancel, current.confirm];
  }
  function close() {
    var current = state;
    if (!current) return;
    state = null;
    current.dispose.forEach(function (dispose) { dispose(); });
    current.root.remove();
    current.inert.forEach(function (entry) { entry.element.inert = entry.value; });
    document.body.style.overflow = current.bodyOverflow;
    document.documentElement.style.overflow = current.htmlOverflow;
    if (current.returnFocus && current.returnFocus.isConnected && typeof current.returnFocus.focus === 'function') current.returnFocus.focus({ preventScroll: true });
  }
  function open(options) {
    options = options || {};
    close();
    installStyle();
    var root = document.createElement('div');
    root.id = 'garage-time-picker';
    root.innerHTML = '<div class="garage-time-dialog" role="dialog" aria-modal="true" aria-labelledby="garage-time-title"><h2 class="garage-time-title" id="garage-time-title"></h2><div class="garage-time-value" aria-live="polite" aria-atomic="true"></div><div class="garage-time-labels" aria-hidden="true"><span>Hodiny</span><span>Minúty</span></div><div class="garage-time-wheels"><div class="garage-time-band" aria-hidden="true"></div></div><div class="garage-time-actions"><button type="button" data-time-cancel>Zrušiť</button><button type="button" data-time-confirm>Potvrdiť</button></div></div>';
    root.querySelector('.garage-time-title').textContent = typeof options.label === 'string' ? options.label : 'Vybrať čas';
    var current = {
      root: root, options: options, wheels: [], dispose: [], inert: [],
      live: root.querySelector('[aria-live]'), cancel: root.querySelector('[data-time-cancel]'), confirm: root.querySelector('[data-time-confirm]'),
      returnFocus: options.returnFocus || document.activeElement,
      bodyOverflow: document.body.style.overflow, htmlOverflow: document.documentElement.style.overflow
    };
    state = current;
    if (!guard(current)) return;
    var initial = /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(options.value) ? options.value : '08:00';
    var parts = initial.split(':').map(Number);
    var container = root.querySelector('.garage-time-wheels');
    ['Hodiny', 'Minúty'].forEach(function (label, column) {
      var element = document.createElement('div');
      element.className = 'garage-time-wheel';
      element.setAttribute('role', 'listbox');
      element.setAttribute('aria-label', label);
      element.setAttribute('aria-orientation', 'vertical');
      element.tabIndex = 0;
      var wheel = { element: element, count: column ? 60 : 24 };
      for (var index = 0; index < wheel.count; index++) {
        var option = document.createElement('div');
        option.className = 'garage-time-option';
        option.id = 'garage-time-' + (column ? 'minute-' : 'hour-') + index;
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', 'false');
        option.dataset.index = index;
        option.textContent = twoDigits(index);
        element.appendChild(option);
      }
      current.wheels.push(wheel);
      container.appendChild(element);
      listen(current, element, 'scroll', function () { if (guard(current)) update(current); }, { passive: true });
      listen(current, element, 'click', function (event) {
        if (!guard(current)) return;
        var option = event.target.closest('[role="option"]');
        if (option && element.contains(option)) {
          element.focus({ preventScroll: true });
          align(wheel, Number(option.dataset.index), true);
          update(current);
        }
      });
    });
    var host = options.host && options.host.isConnected ? options.host : document.body;
    host.appendChild(root);
    // Keep the background out of the tab order and accessibility tree while preserving prior state.
    Array.from(document.body.children).forEach(function (element) {
      if (element === root || element.contains(root) || element.tagName === 'SCRIPT' || element.tagName === 'STYLE') return;
      current.inert.push({ element: element, value: element.inert });
      element.inert = true;
    });
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    current.wheels.forEach(function (wheel, column) { align(wheel, parts[column], false); });
    update(current);
    listen(current, current.cancel, 'click', close);
    listen(current, current.confirm, 'click', function () {
      if (!guard(current)) return;
      // The native scroll position is authoritative, including a confirm during inertia.
      var value = readValue(current);
      var callback = current.options.onConfirm;
      close();
      if (typeof callback === 'function') callback(value);
    });
    listen(current, document, 'keydown', function (event) {
      if (!guard(current)) { event.preventDefault(); event.stopImmediatePropagation(); return; }
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close(); return; }
      var elements = focusables(current);
      if (event.key === 'Tab') {
        event.preventDefault(); event.stopImmediatePropagation();
        var position = elements.indexOf(document.activeElement);
        elements[(position + (event.shiftKey ? -1 : 1) + elements.length) % elements.length].focus({ preventScroll: true });
        return;
      }
      var wheel = current.wheels.find(function (wheel) { return wheel.element === event.target; });
      if (!wheel) return;
      var index = indexAt(wheel), target;
      if (event.key === 'ArrowUp') target = index - 1;
      else if (event.key === 'ArrowDown') target = index + 1;
      else if (event.key === 'PageUp') target = index - 5;
      else if (event.key === 'PageDown') target = index + 5;
      else if (event.key === 'Home') target = 0;
      else if (event.key === 'End') target = wheel.count - 1;
      if (target !== undefined) { event.preventDefault(); event.stopImmediatePropagation(); align(wheel, target, false); update(current); }
    }, true);
    listen(current, document, 'focusin', function (event) {
      if (!guard(current)) return;
      if (!root.contains(event.target)) current.wheels[0].element.focus({ preventScroll: true });
    }, true);
    ['pointerdown', 'touchstart', 'wheel'].forEach(function (type) {
      listen(current, root, type, function (event) {
        if (!guard(current)) { if (event.cancelable) event.preventDefault(); }
        event.stopPropagation();
      }, { passive: false });
    });
    listen(current, root, 'touchmove', function (event) {
      var valid = guard(current);
      if (!valid || !event.target.closest('.garage-time-wheel')) event.preventDefault();
      event.stopPropagation();
    }, { passive: false });
    current.wheels[0].element.focus({ preventScroll: true });
  }

  global.SatoriGarageTimePicker = { open: open, close: close, isOpen: function () { return !!state; } };
})(window);
