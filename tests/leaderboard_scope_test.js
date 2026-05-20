const fs = require('fs');
const assert = require('assert');

const index = fs.readFileSync('index.html', 'utf8');

assert(index.includes('function lbScopeReps()'), 'leaderboard must have a central scope helper');
assert(index.includes("LB_STATE.period = 'all';"), 'visits leaderboard must force all-time period');
assert(index.includes("w.classList.add('hidden')"), 'period tabs should stay hidden');
assert(index.includes("var baseScope = lbScopeReps();"), 'visits ranking must use full leaderboard scope');
assert(index.includes("var rankingScope = lbScopeReps();"), 'Q plnenie ranking must use full leaderboard scope');
assert(index.includes('function plnenieBuildAggregates(resp, q, scopeReps)'), 'plnenie aggregation must accept an explicit scope');
assert(index.includes('var activeReps = Array.isArray(scopeReps) && scopeReps.length ? scopeReps : plnenieGetActiveReps();'), 'plnenie aggregation must default to dashboard scope only when no explicit scope is provided');
assert(index.includes('var agg = plnenieBuildAggregates(resp, lastQ, lbScopeReps());'), 'leaderboard Q plnenie must aggregate the full leaderboard roster');
assert(index.includes('if (scope.length >= 8 && nonEmpty > 0 && nonEmpty < 3) return true;'), 'visits leaderboard must reject suspicious one-rep partial data');
assert(index.includes('function fetchAllHistoryAttempt(attempt)'), 'visits leaderboard must retry getAllHistory before accepting fallback data');
assert(index.includes("setTimeout(function(){ fetchAllHistoryAttempt(attempt + 1); }, 700);"), 'visits leaderboard must retry incomplete all-history responses');
assert(index.includes("finishIncompleteAllHistory('getAllHistory-incomplete');"), 'visits leaderboard must not render suspicious partial data as zeros');
assert(index.includes('var LB_STATIC_REPS = LB_ALL_REPS.slice();'), 'leaderboard must keep a static full-line roster');
assert(index.includes('var isFullRoster = all.length >= LB_STATIC_REPS.length;'), 'partial AM repList must not replace full leaderboard roster');
assert(index.includes('return isFullRoster;'), 'buildRepData must report whether the roster is complete');
assert(index.includes('loadRepList(true);'), 'partial AM roster must trigger a full roster fetch for avatars and names');
assert(index.includes("action=getRepList' + (forceFullRoster ? '&fullLine=1' : '')"), 'forced rep list load must request full-line roster');
assert(index.includes('if (isFullRoster || !Object.keys(LB_REP_INFO).length) LB_REP_INFO = {};'), 'partial AM repList must preserve full leaderboard rep info');
assert(index.includes("if (MGR_STATE.role === 'amwest') return MGR_AM_WEST;"), 'AM West dashboard plnenie must stay scoped to West');
assert(index.includes("if (MGR_STATE.role === 'ameast') return MGR_AM_EAST;"), 'AM East dashboard plnenie must stay scoped to East');
assert(index.includes("btn.innerHTML = '🏆 Rebríček';") && /return;\s*var session = getSession\(\);/.test(index), 'rep nav leaderboard button must not keep a rank badge');

console.log('leaderboard_scope_test ok');
