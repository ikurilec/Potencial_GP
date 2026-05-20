const fs = require('fs');
const assert = require('assert');

const gp = fs.readFileSync('apps_script/kód.gs', 'utf8');
const gyn = fs.readFileSync('apps_script/kód_gyn.gs', 'utf8');

assert(gp.includes('function authGetUser_(ss, username)'), 'GP backend must load the authenticated user profile');
assert(gp.includes('function authAllowedGpReps_(ss, user, fullLine)'), 'GP backend must compute allowed reps by role');
assert(gp.includes('if (fullLine) return null; // leaderboard/plnenie rebricek = cela linia'), 'GP full-line leaderboard endpoints must include all reps');
assert(gp.includes('fullLine') && gp.includes('authFilterGpHistory_(ss, auth.user, rows, repIdx, true)'), 'GP AM leaderboard history must be able to use the full line');
assert(gp.includes('authFilterGpPlnenieRows_(ss, auth.user, planRows, true)'), 'GP AM Q plnenie must be able to use the full line');
assert(gp.includes('authCanAccessGpRep_(ss, auth.user, login2, true)'), 'GP init repList must provide the full leaderboard roster');
assert(gp.includes("var fullLineReps = String(e.parameter.fullLine || '') === '1';"), 'GP getRepList must support explicit full-line roster fetch');
assert(gp.includes('var allowedReps = authAllowedGpReps_(ss, auth.user, fullLineReps);'), 'GP getRepList fullLine must bypass AM-only filtering for leaderboard metadata');
assert(gp.includes('if(rep !== auth.username && !authCanAccessGpRep_(ss, auth.user, rep)) return jsonResponse({ok: false});'), 'GP pingLogin must allow managers to write their own posledny_login');
assert(gp.includes('function authCanAccessGpRep_(ss, user, rep, fullLine)'), 'GP backend must gate rep-specific endpoints');
assert(gp.includes('function authCanAccessGpOblast_(ss, user, oblast)'), 'GP backend must gate pharma region endpoints');
assert(gp.includes('authFilterGpHistory_'), 'GP getAllHistory must filter rows server-side');
assert(gp.includes('authFilterGpPlnenieRows_'), 'GP getPlnenieAll must filter rows server-side');
assert(gp.includes('authFilterLekarneLogin_'), 'GP lekarne endpoints must filter server-side');
assert(gp.includes("if(!authIsGpAdmin_(auth.user)) return jsonResponse({ok: false, error: 'Forbidden'});"), 'GP admin-only writes must be enforced');

assert(gyn.includes('function authGetGynUser_(ss, username)'), 'Gyn backend must load the authenticated user profile');
assert(gyn.includes('function authCanAccessGynRep_(ss, user, rep)'), 'Gyn backend must gate rep-specific data');
assert(gyn.includes('function authCanAccessGynRegion_(user, region)'), 'Gyn backend must gate pharma region data');
assert(gyn.includes('authFilterGynPlanRows_'), 'Gyn getPlnenieAll must filter plans server-side');
assert(gyn.includes('authFilterGynPredRows_'), 'Gyn getPlnenieAll must filter sales server-side');

console.log('role_filtering_test ok');
