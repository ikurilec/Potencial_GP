# Golem Q3 2026 portfolio implementation plan

**Goal:** Apply the approved seven-product achievement rule only to Golem Q3 2026.

**Architecture:** One period-aware product eligibility helper shared by achievement aggregates and report totals. Keep product-only data intact. Recompute affected persisted aggregates from raw data on read. Reuse existing release checkout and Satori UI.

**Tech stack:** Vanilla JavaScript, Node VM fixtures, Playwright, esbuild, GitHub Pages.

- [ ] Add `scripts/test-golem-q3-2026.cjs`: weighted totals and prediction basis for seven included products, exclusions with large cream values, role scopes, period/line isolation, product retention, report totals and old persisted aggregates. Run it and observe failure on existing totals.
- [ ] In `app.js` add `plnenieCountsTowardTotal(key,q,year)` with literal seven-key allowlist guarded by `_plLineTag()==='gp'`, numeric year 2026 and quarter 3. Apply it to aggregate `planKeys` and rep total loop, Home achievement breakdown, action-summary products, report totals and predictions, RP2 achievement product model; pass explicit year where a period object is available. Preserve product cards and raw data. Recompute only affected cached aggregates from `p.data` in `_plLsLoad`.
- [ ] Mirror the change in `nahlad/app.js`; update isolated existing test function imports. Run focused regression and the complete source test runner using private backend fixtures.
- [ ] Add/run browser fixtures at mobile and desktop widths, all eight representative/management contexts, both source and production bundles. Verify product cream detail survives while total remains invariant, Q4 includes cream, navigation and scope remain correct. Capture one mobile result.
- [ ] Bump release metadata consistently, build both distributions, obtain independent review, fix actionable findings, re-run affected checks. Commit only explicit task files and build outputs. Publish to the existing main branch after verifying the remote has not advanced; verify live and preview version and deployed bundles.
