# Explicit refresh recovery — 2.89.30

## Reproduced problems

- The product sheet's refresh action updated sales without refreshing market data. It now refreshes the selected form and the territories displayed for that product, with at most two market reads in parallel.
- Manual refresh could still receive server-cached data, and a delayed explicit read could reuse memory after the 15-second manual window expired. Visible manual reads now carry `fresh=1`; explicitly fresh resources never reuse memory. Automatic reads, writes and unrelated preloads retain their behavior.
- Sales revalidation immediately applied an older DataStore copy, and could apply that copy again after a network failure. This rolled back visible data and could change the product's territory list, cancelling its market batch. A loaded sales view now keeps its current data until a successful server reply. Product navigation identity remains stable while its data-derived territory scope changes.
- Status rows included unrelated territories, forms and quarters and did not label territories. Product status now follows its displayed product, planned representatives and selected quarter. Representative details follow their territory. Region/district names distinguish rows; long disclosures scroll within the mobile sheet.
- A fresh market reply containing the graph did not repair the status of an earlier failed graph read or replace its reusable payload. The validated bundled graph now records successful graph verification and updates reusable values without a second HTTP request, so a warm graph read cannot resurrect the older values.
- Product national share was only inserted once, leaving its header stale after successful refresh. The existing header value now updates along with the representative cells.
- Status transitions recreated the open disclosure and its retry button. Only the status message now updates; the disclosure and its controls keep their actual DOM nodes, native open state and focus through pending/error/success transitions.
- Explicit refresh could be blocked by a local-cache read, and late local/preload replies could replace newer data. Market reads now carry generation guards; an explicit network read can supersede local cache. Existing network reads finish safely before a requested fresh follow-up.
- Gyn's manual detail retry could replace available data with an error card. It now preserves cached detail content on failed refresh and reports the failure in the shared status. Request state also resets on line changes.

## Verification

- `npm test`: 36 source regression suites, including all permitted read actions, manual/automatic behavior, authorization preservation, memory/server cache bypass, sales rollback prevention and the existing role/line/backend regressions.
- Real UI regression with controlled replies: product retry and updated values; sachet detail retry; bounded failure with cached content; 19 product refreshes across Golem, Reagila and Gyn manager roles; delayed IndexedDB; Gyn detail outage; 12 territory reads and a reachable action at 320px.
- Compiled-asset checks: 489 view/role/line status transitions, 21 Home checks, 27 cold market cases, report market recovery, status collapse, and trusted Android/iPhone touch emulation.
- Source parity, syntax, asset hashes and service-worker references checked for both targets.

Tests use controlled backend responses and Chromium mobile emulation, with no production writes. Live authenticated Sheets and physical devices were not directly tested. No Apps Script changes or redeployment are required by this release.

## Release

Live and preview use version 2.89.30 and the same application sources. Existing Satori typography, buttons, colors and animations are retained.
