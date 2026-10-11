# Zasunutie úspešného overenia

User-approved behavior: when all shown data groups succeed, show green success briefly, then slide/collapse the read status upward. Manual pull-to-refresh restores the status while keeping cached content visible. Apply to both preview/live and all existing data views/roles/lines.

The presentation stays separate from request scheduling and freshness. Completion requires every displayed group to have a successful check in this session, with no pending/error/unknown group. A 1.6-second success interval is followed by a 280ms height/padding/opacity/translate transition. Failure remains visible with the existing Satori retry button. Expanded details or keyboard focus pause dismissal. Reduced-motion users get an immediate collapse after the same success interval.

Keep collapse state in a bounded per-view/session map so redraws and short returns do not repeatedly display the same success. New pending/error states clear the dismissed state. Timers check active view, login epoch and element before acting. Never alter API calls, dates, scopes or permissions.

- [x] Add and run a failing browser test for successful collapse and recovery.
- [x] Implement presentation lifecycle in app.js and its preview copy; add Satori-compatible collapse rules to both stylesheets.
- [x] Verify partial/failed/unknown data, pending spinner identity, expanded details/focus, rapid refresh, context changes, redraw/return, reduced motion and mobile layout. Cover actual view mappings for every current role/line.
- [x] Run source regressions and relevant browser navigation/pull/Home tests; bump version, build both targets and repeat against compiled assets.

Release procedure: commit/push the checked release and verify published versions, hashes and service workers independently. The release report records remote verification after deployment.

Files: app.js, app.css, nahlad counterparts; scripts/test-read-collapse.cjs and scripts/test-read-collapse-browser.cjs; version/package metadata and generated assets. No backend redeploy.
