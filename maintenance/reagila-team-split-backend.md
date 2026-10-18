# Reagila backend — staged West/East support

Prepared and verified privately, then promoted to the owner's canonical `apps_script/KOD_REAGILA.txt` on 18 October 2026. The old local source is preserved as `apps_script/KOD_REAGILA.before-west-east-2026-10-18.txt`. No account provisioning, Google deployment or live migration was performed during implementation. Golem/GYN backend source is unchanged. The owner-facing deployment guide is the private `apps_script/REAGILA_WEST_EAST_POSTUP.md`.

## Deployment and access are separate actions

The owner first redeploys the reviewed Reagila script with Script Property `REAGILA_TEAM_SPLIT_ENABLED` absent (or any value other than the exact string `true`). This preserves current KAM and legacy AM behavior. Explicit `AM West`/`AM East` accounts are staged and cannot log in or use an old token while the flag is off. The frontend must consume the server capability before using the split organization.

The token-protected `getReagilaTeamSplitInfo` endpoint needs no personal login and returns only `ok`, `team_split_supported:true`, `team_split_version:1` and `team_split_enabled`. It can verify the owner actually redeployed support. It has no mutation or roster output. The session-authenticated, strictly admin-only `getReagilaTeamSplitStatus` provides the detailed readiness report without passwords or session data. The matching editor helper is `reagilaTeamSplitReadiness_(ss)`.

Before any live access change, obtain a separate immediate confirmation that Hana will receive West representative data and absences/approval notifications, and that Lenka's work scope changes to East. Code review/deployment approval alone does not authorize activation. The owner separately provisions Hana's existing account login in Reagila and enters the password personally. This code never creates an account or copies, changes, logs or backs up passwords. Hana's preactivation role must already be `AM West`, which is denied access while staged; do not give her legacy `AM`.

## Exact migration, only after separate confirmation

The editor-only helper `reagilaActivateTeamSplit_` has no HTTP activation route. It requires both:

```js
{
  confirm: 'ACTIVATE_REAGILA_WEST_EAST_ACCESS',
  source_version: 'reagila-teams-v1'
}
```

Do not call it as a readiness test. Before calling, verify the actual deployed revision through the capability endpoint and detailed readiness, stop concurrent edits of `Pouzivatelia`, and keep the reviewed script revision fixed. A source-version argument identifies the reviewed source; it cannot by itself prove which web-app deployment the owner selected.

The helper requires exactly the four confirmed KAM accounts and territories, an existing provisioned Hana account in staged `AM West`, and Lenka in `AM` or `AM East`. Unexpected KAMs, duplicate logins/headers, missing accounts, missing approver header and mismatched territory/role block activation. The helper appends `tim` only if it does not already exist. It writes these metadata changes only:

| Login | Source role | tim | Territory retained | Approver |
| --- | --- | --- | --- | --- |
| m.sibert | KAM | west | BA | h.madaraszova |
| z.bernatova | KAM | west | SE | h.madaraszova |
| l.hricova | KAM | east | ST | l.faber |
| p.papcun | KAM | east | VY | l.faber |
| h.madaraszova | AM West | west | unchanged | unchanged |
| l.faber | AM East | east | unchanged | unchanged |

A script lock excludes overlapping scripted activation. The server stores and rereads a metadata-only backup under the returned `REAGILA_TEAM_SPLIT_BACKUP_<id>` Script Property before editing any source cells. It contains login/row/role/team/approver metadata, the original team header and prior generation/session cutoff; it excludes passwords, avatars, history, sales and credential values. Preserve this backup for owner-controlled recovery.

During mutation, `REAGILA_TEAM_SPLIT_MIGRATING` blocks all six affected accounts. After rereading and verifying every target, activation advances the scope generation and cache epoch, records a session cutoff for the six accounts, enables the flag last and then removes the migration block. Existing affected tokens must log in again. No old calendar events or notifications are rewritten/replayed. A failed write disables the flag and restores the backed-up metadata; if restoration cannot be verified, affected accounts remain blocked and owner review is required. There is no automatic postactivation rollback helper: restoring wider legacy access requires an explicit owner decision.

## API and data boundaries

`reagilaUserMeta_(rows,row)` resolves `tim` by header. `reagilaAppRole_(role,tim)` maps source KAM to `rep west` or `rep east` only when enabled. Missing/invalid `tim` maps to plain `rep`, preserving only personal private access and never inferring another team. Login, current-user session checks, roster, init and bootstrap advertise consistent capability; login/roster also return `tim`.

Sessions reread current `Pouzivatelia` metadata for each HTTP request, rather than trusting a client/token role. Plain legacy `AM` is denied after activation. Admin/BOSS/BUM/PM retain full management scope. AM West/East read only their team's private history, pharmacy rows, market territories, usage, agreements and calendar absences. Direct foreign login/territory and `fullLine=1` do not override those checks. Existing calendar event owner cannot be reassigned. Approval and request notifications use the current approver header and additionally exclude an AM from the other team; approved absence broadcasts follow current event visibility.

Activity and agreements retain the narrower pre-existing exception: only admin gets all user roles; BOSS/BUM/PM get KAM rows, and split AMs get only their KAM team. Plain legacy AM remains Forbidden on these two endpoints, as in the baseline. Activity cache uses this actual permitted KAM map, keeping warmed admin statistics separate from management statistics. Filtered history responses preserve the physical sheet row number for subsequent note writes, including interleaved teams.

Two deliberate shared comparisons remain:

- `getPlnenieAll` returns common full-line sales/plan comparison data for authenticated users, as before, with or without `fullLine`.
- `getRepList&fullLine=1` returns the public comparison roster. A cross-scope rep contains only `login`, `meno`, mapped `rola`, `tim`, `region`, `pohlavie` and `avatar`; private `schvalovatel` and `reagila_ms_vyber` appear only within the requester's private scope. The default roster and `getInitData.repList` use private scope.

Usage and private market cache keys include the verified allowed-login scope, activation state and membership generation. Territory authentication happens before market cache reads. Pharmacy caches contain source rows by login and are filtered against current roster before any response; no cached all-line response is returned directly to an AM. Shared sales caches are deliberately common. Client cache quarantine and late-response guards are a separate frontend responsibility.

## Local verification

Use Node fixtures only; do not execute Apps Script activation helpers against Google as tests. Set `SATORI_APPS_SCRIPT_DIR` and `SATORI_BACKEND_DIR` to the canonical private backend folder. `SATORI_REAGILA_SCRIPT` can select an isolated draft for the split fixtures. Set `SATORI_CONVERTER_DIR` to the private Reagila converter folder for converter fixtures.

Passed:

- `node scripts/test-reagila-team-split.cjs` — 22 synthetic full-script fixtures, including off/on roles, private route denial, explicit shared comparison, comparison-roster privacy, team broadcasts, request routing, metadata backup/rollback, header append, session cutoff, management baseline/cache isolation and physical history row IDs.
- `node scripts/test-stock-session.cjs` — all 24 role flows across lines, staged AM rejection, activated AM access, token namespace/stock-field isolation.
- `node scripts/test-notification-routing.cjs` — unchanged legacy mute/line/recipient transitions across all three lines.
- `node scripts/test-backend-cache-performance.cjs` — contention, chunk completeness and generation separation across all lines.
- `node scripts/test-pharmacy-server-fresh.cjs` — fresh source reads without durable-cache waits for Golem/Reagila.

Release 2.92.26 also passed all 70 source suites and 44 browser fixture combinations (live/preview, mobile/desktop, four KAM, two split AMs, full management and legacy AM). Frontend comparison metadata is separate from the private work roster, so the shared ranking keeps all four KAM while each AM works with two. Public profiles preserve names/avatars/initials without importing cross-scope approvers or market configuration. Ranking links cannot open another team's private detail. Report reads, agreement save/delete callbacks and delayed delete confirmation reject previous account/line/epoch state.

Still required after owner redeployment and separately approved activation: real-account scope/readiness checks, mobile/desktop views, correct new request recipients, old-session logout/new login and confirmation of the selected live web-app revision. Local fixtures cannot validate Google service permissions, existing sheet protections, live credentials or deployment selection.
