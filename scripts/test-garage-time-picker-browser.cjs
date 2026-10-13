/* Chrome device emulation exercises native touch scrolling; this is not a Safari/iOS test. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Ivan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '..');
const modulePath = path.join(root, 'garage-time-picker.js');
const html = '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;height:2000px;--font-body:Arial,sans-serif;--font-display:Arial,sans-serif;--color-primary:#2563eb;--color-primary-dark:#1e40af;--color-navy:#0c1e35;--color-text:#334155;--color-text-muted:#64748b;--color-surface:#fff;--color-border:#e2e8f0;--radius-xl:20px;--radius-md:12px;--shadow-xl:0 24px 48px #0c1e3530}button{min-height:44px}#parent{padding:20px}</style></head><body><div id="parent"><button id="trigger">Čas od</button><input id="value" value="08:00"><button id="outside">Outside</button></div></body></html>';

async function fixture(browser, options = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, ...options });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setContent(html);
  if (fs.existsSync(modulePath)) await page.addScriptTag({ path: modulePath });
  assert.equal(await page.evaluate(() => typeof window.SatoriGarageTimePicker?.open), 'function', 'time wheel API is available');
  await page.evaluate(() => {
    window.calls = [];
    window.currentOwner = 'ivan';
    window.currentView = 'garage';
    window.openPicker = (value = '08:00', label = 'Čas od') => {
      document.getElementById('trigger').focus();
      SatoriGarageTimePicker.open({ value, label, returnFocus: document.getElementById('trigger'),
        isActive: () => currentOwner === 'ivan' && currentView === 'garage',
        onConfirm: value => { calls.push(value); document.getElementById('value').value = value; } });
    };
  });
  return { context, page, errors };
}
async function open(page, value = '08:00', label = 'Čas od') {
  await page.evaluate(({ value, label }) => openPicker(value, label), { value, label });
  await page.locator('#garage-time-picker [role="dialog"]').waitFor();
}
const wheel = (page, label) => page.getByRole('listbox', { name: label, exact: true });
async function settle(page) {
  await page.waitForFunction(() => [...document.querySelectorAll('#garage-time-picker [role="listbox"]')].every(el => Math.abs(el.scrollTop / 40 - Math.round(el.scrollTop / 40)) < .02));
}
async function actual(page) {
  return page.evaluate(() => [...document.querySelectorAll('#garage-time-picker [role="listbox"]')].map(el => String(Math.round(el.scrollTop / 40)).padStart(2, '0')).join(':'));
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const { context, page, errors } = await fixture(browser);
    await open(page);
    assert.equal(await actual(page), '08:00');
    assert.equal(await page.locator('#garage-time-picker [aria-live]').textContent(), '08:00');
    assert.equal(await wheel(page, 'Hodiny').getAttribute('aria-activedescendant'), 'garage-time-hour-8');
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Hodiny');
    assert.equal(await wheel(page, 'Hodiny').getByRole('option').count(), 24);
    assert.equal(await wheel(page, 'Minúty').getByRole('option').count(), 60);
    await page.getByRole('button', { name: 'Potvrdiť', exact: true }).click();
    assert.deepEqual(await page.evaluate(() => calls), ['08:00']);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'trigger');
    console.log('PASS default 08:00, accessible selected value, confirm and return focus');

    await open(page, '23:59');
    assert.equal(await actual(page), '23:59');
    await wheel(page, 'Hodiny').press('Home');
    await wheel(page, 'Minúty').press('Home');
    await page.getByRole('button', { name: 'Potvrdiť', exact: true }).click();
    assert.equal(await page.locator('#value').inputValue(), '00:00');
    await open(page, '00:00');
    await wheel(page, 'Hodiny').press('End');
    await wheel(page, 'Minúty').press('End');
    await page.getByRole('button', { name: 'Potvrdiť', exact: true }).click();
    assert.equal(await page.locator('#value').inputValue(), '23:59');
    await open(page, '08:00');
    await wheel(page, 'Hodiny').press('ArrowDown');
    await wheel(page, 'Minúty').press('PageDown');
    assert.equal(await actual(page), '09:05');
    await wheel(page, 'Hodiny').press('ArrowUp');
    await wheel(page, 'Minúty').press('PageUp');
    assert.equal(await actual(page), '08:00');
    await page.keyboard.press('Escape');
    console.log('PASS keyboard extremes, arrows and page increments');

    await open(page, '22:58');
    await wheel(page, 'Hodiny').getByRole('option', { name: '23', exact: true }).click();
    await wheel(page, 'Minúty').getByRole('option', { name: '59', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('#garage-time-picker [aria-live]').textContent === '23:59');
    await settle(page);
    await page.getByRole('button', { name: 'Potvrdiť', exact: true }).click();
    assert.equal(await page.locator('#value').inputValue(), '23:59');
    await open(page, '00:00');
    await wheel(page, 'Hodiny').evaluate(el => { el.scrollTop = 23 * 40; });
    await wheel(page, 'Minúty').evaluate(el => { el.scrollTop = 59 * 40; });
    await page.getByRole('button', { name: 'Potvrdiť', exact: true }).click();
    assert.equal(await page.locator('#value').inputValue(), '23:59');
    console.log('PASS tap and actual native scroll position at 23:59');

    await open(page);
    const immediate = await page.evaluate(() => {
      const wheels = [...document.querySelectorAll('#garage-time-picker [role="listbox"]')];
      wheels[0].scrollTop = 5 * 40;
      wheels[1].scrollTop = 17.6 * 40;
      // Confirm before scroll events can update the visible preview.
      const preview = document.querySelector('#garage-time-picker [aria-live]').textContent;
      const actual = wheels.map(el => String(Math.round(el.scrollTop / 40)).padStart(2, '0')).join(':');
      document.querySelector('#garage-time-picker [data-time-confirm]').click();
      return { preview, actual, confirmed: calls.at(-1) };
    });
    assert.equal(immediate.preview, '08:00');
    assert.equal(immediate.confirmed, immediate.actual);
    assert.notEqual(immediate.confirmed, immediate.preview);
    await page.locator('#value').fill('23:59');
    console.log('PASS immediate confirm reads rounded scroll position before preview updates');

    const count = await page.evaluate(() => calls.length);
    await open(page);
    await wheel(page, 'Hodiny').press('End');
    await page.getByRole('button', { name: 'Zrušiť', exact: true }).click();
    await open(page);
    await page.keyboard.press('Escape');
    await open(page);
    await page.evaluate(() => SatoriGarageTimePicker.close());
    assert.equal(await page.evaluate(() => calls.length), count);
    assert.equal(await page.locator('#value').inputValue(), '23:59');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'trigger');
    assert.equal(await page.evaluate(() => document.body.style.overflow), '');
    console.log('PASS cancel, Escape and parent back close without applying');

    for (const invalidation of ['currentOwner', 'currentView']) {
      await open(page);
      await page.evaluate(key => {
        window[key] = 'other';
        document.querySelector('#garage-time-picker [data-time-confirm]').click();
      }, invalidation);
      assert.equal(await page.evaluate(() => SatoriGarageTimePicker.isOpen()), false);
      assert.equal(await page.evaluate(() => calls.length), count);
      await page.evaluate(() => { currentOwner = 'ivan'; currentView = 'garage'; });
    }
    await open(page);
    await page.evaluate(() => {
      currentOwner = 'other';
      document.querySelector('#garage-time-picker [role="listbox"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    });
    assert.equal(await page.evaluate(() => SatoriGarageTimePicker.isOpen()), false);
    await page.evaluate(() => { currentOwner = 'ivan'; });
    console.log('PASS owner/view invalidation blocks confirmation and next interaction');

    await open(page);
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Potvrdiť');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Hodiny');
    await page.evaluate(() => document.getElementById('outside').focus());
    assert.equal(await page.evaluate(() => document.getElementById('garage-time-picker').contains(document.activeElement)), true);
    await page.evaluate(() => {
      document.getElementById('parent').innerHTML = '<button id="replacement">Replacement</button><input id="value" value="08:00">';
    });
    assert.equal(await page.evaluate(() => SatoriGarageTimePicker.isOpen()), true);
    await page.getByRole('button', { name: 'Potvrdiť', exact: true }).click();
    assert.equal(await page.evaluate(() => calls.length), count + 1);
    await page.evaluate(() => {
      document.getElementById('parent').innerHTML = '<button id="trigger">Čas od</button><input id="value" value="08:00"><button id="outside">Outside</button>';
    });
    for (let i = 0; i < 5; i++) {
      await open(page);
      await page.evaluate(() => SatoriGarageTimePicker.close());
    }
    await open(page, '12:34', '<img src=x onerror="window.injected=true">');
    assert.equal(await page.locator('#garage-time-picker img').count(), 0);
    await page.evaluate(() => {
      const button = document.querySelector('#garage-time-picker [data-time-confirm]');
      button.click(); button.click();
    });
    assert.equal(await page.evaluate(() => calls.length), count + 2);
    assert.equal(await page.locator('#value').inputValue(), '12:34');
    assert.deepEqual(errors, []);
    console.log('PASS focus trap, parent rerender, literal label, reopen and single callback');
    await context.close();

    for (const [name, width, ua] of [
      ['android', 390, 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'],
      ['iphone-emulated', 320, 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1']
    ]) {
      const { context: mobileContext, page: mobile, errors: mobileErrors } = await fixture(browser, { viewport: { width, height: 740 }, isMobile: true, hasTouch: true, userAgent: ua, reducedMotion: 'reduce' });
      await open(mobile, '08:00');
      const cdp = await mobileContext.newCDPSession(mobile);
      const trustedEvents = await mobile.evaluate(() => {
        window.trustedTouches = 0;
        document.addEventListener('touchmove', e => { if (e.isTrusted) trustedTouches++; }, { passive: true, capture: true });
        return trustedTouches;
      });
      assert.equal(trustedEvents, 0);
      const bounds = await wheel(mobile, 'Hodiny').boundingBox();
      const x = bounds.x + bounds.width / 2, y = bounds.y + 165;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      for (let step = 1; step <= 10; step++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - step * 12 }] });
        await mobile.waitForTimeout(25);
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await mobile.waitForTimeout(700);
      await settle(mobile);
      assert.equal(await mobile.evaluate(() => trustedTouches > 0), true);
      assert.equal(await wheel(mobile, 'Hodiny').evaluate(el => el.scrollTop > 8 * 40), true, 'trusted touch pans the native wheel');
      assert.equal(await mobile.evaluate(() => window.scrollY), 0, 'wheel gesture does not scroll background');
      await wheel(mobile, 'Hodiny').press('End');
      await wheel(mobile, 'Minúty').press('End');
      const alignment = await mobile.evaluate(() => [...document.querySelectorAll('#garage-time-picker [role="listbox"]')].map(el => {
        const selected = el.querySelector('[aria-selected="true"]').getBoundingClientRect();
        const rect = el.getBoundingClientRect();
        return Math.abs(selected.y + selected.height / 2 - rect.y - rect.height / 2);
      }));
      assert.ok(alignment.every(delta => delta < 1), 'selected rows align with centre band');
      assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
      const output = path.join(root, '.tmp', 'garage-time-picker-tests');
      fs.mkdirSync(output, { recursive: true });
      await mobile.screenshot({ path: path.join(output, `${name}-${width}.png`) });
      await mobile.getByRole('button', { name: 'Potvrdiť', exact: true }).tap();
      assert.deepEqual(await mobile.evaluate(() => calls), ['23:59']);
      assert.deepEqual(mobileErrors, []);
      console.log(`PASS ${name} ${width}px trusted native touch, centred rows, no background scroll, reduced motion`);
      await mobileContext.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
