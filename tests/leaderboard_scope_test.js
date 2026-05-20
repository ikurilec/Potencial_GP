const fs = require('fs');
const assert = require('assert');

const index = fs.readFileSync('index.html', 'utf8');

assert(index.includes('function lbScopeReps()'), 'leaderboard must have a central scope helper');
assert(index.includes("LB_STATE.period = 'all';"), 'visits leaderboard must force all-time period');
assert(index.includes("w.classList.add('hidden')"), 'period tabs should stay hidden');
assert(index.includes("var baseScope = lbScopeReps();"), 'visits ranking must use full leaderboard scope');
assert(index.includes("var rankingScope = lbScopeReps();"), 'Q plnenie ranking must use full leaderboard scope');
assert(index.includes("if (MGR_STATE.role === 'amwest') return MGR_AM_WEST;"), 'AM West dashboard plnenie must stay scoped to West');
assert(index.includes("if (MGR_STATE.role === 'ameast') return MGR_AM_EAST;"), 'AM East dashboard plnenie must stay scoped to East');
assert(index.includes("btn.innerHTML = '🏆 Rebríček';") && /return;\s*var session = getSession\(\);/.test(index), 'rep nav leaderboard button must not keep a rank badge');

console.log('leaderboard_scope_test ok');
