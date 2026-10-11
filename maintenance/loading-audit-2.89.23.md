# Satori 2.89.23 — loading audit

## Delivered changes

- Render saved market data immediately, before previous-quarter enrichment. A single combined overview/district/trend request replaces duplicate reads.
- Finish graph subscribers even when server data is unchanged. Valid empty replies complete loading; malformed replies retain the last successful cache and remain retryable.
- Produce product/quarter preloads with one worker and report reads with two workers. Prioritize the visible view and release client request slots on account/line changes.
- Normalize blocking Apps Script read budgets to at least 30 seconds. Identical reads with different short budgets share one transfer. Reads and writes remain separate.
- Scope persistent market caches by account, role and line; prevent delayed responses from updating another account, colleague or screen.
- Bound manager, representative and Gyn quarter preloads. Keep cached elapsed quarters visible and avoid downloading future quarters.
- Guard pharmacy reads and full-line callbacks against account changes; skip invalid personal pharmacy preloads for managers.
- Preserve plan-based default periods on Home/fulfillment, calendar-based rankings/team fulfillment, backend access restrictions and existing Satori controls.

## Apps Script deployment required

Updated private sources are in the owner's `apps_script` folder: `KOD_GOLEM.txt`, `KOD_GYN.txt`, and `KOD_REAGILA.txt`. They are intentionally excluded from Git. The minimal change is recorded in `apps-script-cache-performance.patch` without credentials or spreadsheet IDs.

The recorded patch uses zero context lines to exclude unrelated private source. Apply it only to matching original local files with `git apply --unidiff-zero`; the owner's local sources already contain these changes.

For each line, replace the corresponding Apps Script source and update its existing web-app deployment to a new version. Keep the deployment URL and existing access configuration. GitHub Pages deployment updates only the frontend; it does not deploy Google Apps Script.

The server changes concern optional response caches:

- Cache writes wait at most 200 ms for their lock and never write without acquiring it. Previously they waited up to 20 seconds and continued writing after lock failure.
- Large responses use UTF-16-safe chunks in the fast cache. Immutable chunk generations prevent concurrent writes from producing mixed responses. Incomplete chunks are cache misses.
- The new memory-cache namespace keeps old deployments isolated. Existing data TTLs, source-data writes, authorization checks and explicit fresh reads are preserved.

First reads after server deployment may be cold. Subsequent reads reuse cache when available. The frontend is compatible with the existing backend, but server-side improvements require these three redeployments.

## Verification performed

- 28 source regression suites, including all three local backend scripts, notification routing and cache invalidation.
- Built mobile browser matrices: 27 role/line cold market screens, 14 manager district combinations, 15 Home combinations and 12 manager report combinations.
- Additional built-browser checks: scoped area-manager boot and line changes; data freshness; plan periods/year rollover; stocks and overlays; continuous spinner identity; global navigator; pharmacy filters, September history, detail refresh and cleanup.
- Trusted touch events in Android/iPhone browser emulation across 18 role/line combinations per platform: pull refresh, cancellation, scroll boundaries, horizontal gestures and modal guards.
- Reviewed read/action routes and tested foreground notification dispatch across 45 role/line combinations, including board comments and calendar absence approvals.
- Final market/report/Home browser checks repeated against the final hashed build after the last market-context changes.

No live user data was changed by these tests. Browser/API fixtures exercise the real application code with deterministic responses. Physical-device Safari/Android behavior, Google infrastructure latency and end-to-end FCM delivery are not established by emulation or routing tests.

## Reproduce

`npm test` runs source regressions. Because backend sources are private, set `SATORI_APPS_SCRIPT_DIR` to the folder containing all three `KOD_*.txt` files when they are not available in a local `apps_script` folder. The runner also supplies the older `SATORI_BACKEND_DIR` alias to notification tests.

`npm run build` regenerates matching live/preview bundles and service-worker manifests. For browser suites set `SATORI_TEST_BUILD=1` to exercise hashed build assets, and `SATORI_PLAYWRIGHT` to an installed Playwright module if it is not available in the default runtime. Run `node scripts/test-loading-performance-browser.cjs`, `node scripts/test-report-market-browser.cjs`, and `node scripts/test-home-district-browser.cjs` for the final focused matrix.
