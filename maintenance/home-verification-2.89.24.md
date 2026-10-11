# Satori 2.89.24 — Home verification recovery

## Confirmed regressions

- A failed foreground check remained in `APP_READ_CHECKS.failures` after a successful background refresh of the same resource. The metadata said success while the visible status still said failure. A later failed silent refresh could also hide the earlier visible failure in persisted metadata.
- The scheduler promoted every background request matching a Home card to foreground. Login preloads could occupy both request slots ahead of the actual Home check. Deferred boot reads could also restart its indicator.
- Manager fulfillment waited for optional Config/report-date metadata before starting its selected-quarter request. The default period is already established by plan availability; report metadata must not gate its data.
- Stock/calendar/board paths still used a short preload budget. A valid 14-second stock response was cut off at 12 seconds.
- Representative fulfillment used the loading state of all historical quarters as the current-quarter loading state. Reagila representatives also took the manager-state branch of Home/product revalidation.

## Changes

- A successful current-generation read clears the matching visible failure, including successful silent recovery. Failed silent retries preserve an actual visible failure. Overlapping subscribers retain visible failure attribution; stale generations and other accounts/lines remain isolated.
- Home preloads and background Config reads keep background priority, leaving capacity for explicit verification. Deferred boot dependencies do not restart Home progress. Optional Config reads do not create a screen-wide failure indicator.
- Missing manager quarter data starts immediately. Report-date metadata updates independently; its changed stamp still revalidates a fully cached quarter.
- Stock, calendar, board, roster, init and history pure reads share the same minimum 30-second cold-server budget as market/fulfillment reads. Network and queue limits remain bounded; this is not a claim that a cold server becomes faster.
- Current representative-quarter loading completes before historical preloads. Historical preloads no longer prevent checking already displayed fulfillment. Reagila Home/product checks use representative state for its representatives.
- Live and preview sources, hashed bundles, versions and service workers are synchronized at 2.89.24. No new Apps Script changes or additional redeploy are required for this patch.

## Validation

Reproduced the retained Home failure and blocked manager request with failing regression tests before their fixes. `npm test` runs 29 source suites, including the new status-recovery tests. Browser checks include 126 common status combinations across three lines and applicable roles, recovery while preserving displayed content, and a real delayed 14-second response in the browser fixture. Also checked actual admin/boss/BUM login flows, line switching, plan-based periods, generic freshness, market/report views and spinner identity. Final focused checks run against the hashed build.

These tests use synthetic accounts/responses and do not write live user data. Physical phones and the authenticated production backend latency are not established by the fixtures; the update fixes the evidenced client-side sequencing and status defects rather than asserting that every production delay has one cause.
