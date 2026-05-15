const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

function extractFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  assert.notStrictEqual(start, -1, `${name} function not found`);
  const bodyStart = html.indexOf('{', start);
  let depth = 0;
  for (let i = bodyStart; i < html.length; i++) {
    if (html[i] === '{') depth++;
    if (html[i] === '}') depth--;
    if (depth === 0) return html.slice(start, i + 1);
  }
  throw new Error(`${name} function end not found`);
}

const calls = [];
const sandbox = {
  LK_STATE: { preloadAllStarted: false },
  LB_ALL_REPS: ['a.one', 'b.two', 'c.three'],
  setTimeout(fn) { fn(); return 1; },
  lkFetch(login) { calls.push(login); },
};
vm.createContext(sandbox);
vm.runInContext(extractFunction('lkPreloadAll'), sandbox);

sandbox.lkPreloadAll();

assert.deepStrictEqual(calls, ['a.one', 'b.two', 'c.three']);
assert.strictEqual(sandbox.LK_STATE.preloadAllStarted, true);

console.log('lekarne preload test passed');
