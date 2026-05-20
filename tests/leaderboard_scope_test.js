const fs = require('fs');
const assert = require('assert');

const index = fs.readFileSync('index.html', 'utf8');

assert(index.includes('function lbScopeReps()'), 'leaderboard must have a central scope helper');
assert(index.includes("LB_STATE.period = 'all';"), 'visits leaderboard must force all-time period');
assert(index.includes("w.classList.add('hidden')"), 'period tabs should stay hidden');
assert(index.includes("var baseScope = lbScopeReps();"), 'visits ranking must use full leaderboard scope');
assert(index.includes("var rankingScope = lbScopeReps();"), 'Q plnenie ranking must use full leaderboard scope');
assert(index.includes("function plnenieGetActiveReps()") && index.includes('return MGR_ALL;'), 'manager Q plnenie must use the full line');

console.log('leaderboard_scope_test ok');
