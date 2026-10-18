# Golem Lonelix forms — October 2026

The actual October territorial export contains `GOL_LONELIXsyr` and `GOL_LONELIXtbl`. The old sales converter read only `GOL_LONELIX`, silently returning zero for both new columns. The pharmacy export already uses supported sheet names `LONELIX_syrup_150ml` and `LONELIX_tbl_1000mg_3x10`.

The private sales converter now exports `lonelix_sr` and `lonelix_tb`, appended to both existing export layouts. `LONELIX` remains the combined amount for compatibility with existing brand plans. An explicit syrup column takes precedence over the legacy syrup column, so old parent/child headers cannot double-count the same sales. Old files with only `GOL_LONELIX` still import as syrup. Monthly euro and pack sections use the same form mapping. Regional pack prices include each form. Form corrections update the aggregate unless an aggregate correction was explicitly set. Product summary totals still count the brand once.

The frontend shows both forms with existing Satori cards and colors, including positive sales without a plan. Such sales do not inflate achievement percentages or ranking totals. If a real plan is later provided for a form, normal achievement calculations apply. Manager product drill-down now also lists representatives with sales but no form plan, displays “Bez plánu” instead of an invented percentage, and respects West/East working scope. The default-quarter policy remains unchanged: October sales belong to Q4; missing Q4 plans can still select Q3 by default.

The private stocks converter classifies syrup and tablets as independent `lonelix_sr`/`lonelix_tb` rows from the packaging name. The same package cannot be imported as both an aggregate and a form. Missing form data remains `missing_in_report`; unknown packaging remains unmatched. Existing pharmacy form columns and filters were verified without changing their schema. Current market-share source files contain no Lonelix export; no market shares or source codes were invented.

No Apps Script changes are required: the existing Golem reader returns new product columns by header. No live sheet cells or historical data were edited. Private converter files remain outside the public release.

Verification:

- `scripts/test-golem-lonelix-october.cjs`: October/legacy headers, prices, totals/detail exports, returns, corrections, form stock mapping, pharmacy imports, backend column pass-through, personal/team scopes and planned/unplanned achievement.
- Actual October territorial source: all 12 territories and every imported month reconciled independently for syrup/tablets; October 2026 tablets are present in all 12.
- Actual KE pharmacy source: October syrup/tablet unit sums independently reconcile with original sheets.
- `scripts/test-golem-lonelix-browser.cjs`: live/preview, 390/1280 widths, West/East reps, both AMs, admin/BOSS/BUM/PM; product cards, scoped drill-down and totals.

Owner import: reopen/refresh the existing private Golem sales converter, load the current source files and replace the existing `Predaje_2` export including its full header. Do not append a second copy of the same rows. The added columns are `lonelix_sr` and `lonelix_tb`. Reimport pharmacy or stock outputs only when updating those source data; sales conversion does not create pharmacy units or stock levels.
