# Stock authentication and report recovery — 2.89.31

## Reproduced causes

- Reagila login stores sessions with the historical namespace `gp` in the private Reagila spreadsheet. Its stock route authenticated against `reagila`, so valid logins always failed with `Session expired / no_match`. The corrected handler authenticates against `gp` in that same Reagila spreadsheet. Stock filtering and cache keys continue to select only Reagila rows. No session migration or relaxed authentication is needed.
- Report verification matched market reads using only sales year/quarter parameters, which market endpoints do not carry. It therefore showed failed or old market requests from other screens, territories, products and quarters. Reports now use strict per-action market scope; group reports and Gyn reports exclude market endpoints they do not load.
- The inline report retry reused old valid in-memory product payloads, leaving their failed verification metadata red. Both report retry controls now trigger a fresh server batch for the selected report.
- Warm navigation between representatives restores the selected market product scope even when no network read is needed. The GP individual benchmark retains its own overview verification and explicit refresh; failed overview reads preserve displayed data and remain retryable. Account and generation guards reject late replies.
- Aflamil Family mapped to the first market form only. The batch now includes both `AFLtbl` and `AFLsach`; limits apply to planned products before expanding their forms. Existing report calculations and market-share definitions remain unchanged.

## Deployment

Frontend: publish live and preview as 2.89.31, with matching version metadata and compiled assets.

Backend: **redeploy only Reagila** from the corrected private local `apps_script/KOD_REAGILA.txt` using a new Apps Script deployment version and the existing deployment URL. `reagila-stock-auth.patch` records the exact small change without publishing the private script. Golem and Gyn need no redeployment. A frontend update alone cannot correct the already-deployed stock authentication handler.

## Validation

- Before the backend fix, the actual login/session/stock implementation failed on a valid Reagila KAM login with `Session expired`. After it, login → stock read → explicit refresh → logout passes for 24 role/line combinations across all three backend sources. Tests also reject invalid/expired/logged-out tokens and cross-backend sessions, check authentication before cached reads, exclude other lines and internal stock columns, and select the latest stock report.
- Failing source regressions reproduced unrelated market status rows and an inline retry that fetched only one product instead of all selected products. The corrected scope and fresh retry pass.
- Review identified a cached representative return losing its market rows and a benchmark overview missing from retries. Both have failing-before/fixed-after regressions, including warm cache reuse, late replies, a changed account and retry after initial overview failure.
- 39 source regression suites pass. Final compiled assets pass 16 mobile/desktop report cases covering eight manager roles and eight selected regions, both Aflamil forms, a failed sachet read with cached data, the actual header button, fresh server URLs, overview failure/recovery and cached region returns. Group reports exclude old market rows. Existing 12 manager/line report cases, 489 screen/role/line status transitions, 21 Home cases, 19 product refresh cases and stock/market recovery tests also pass.
- Browser responses and Sheets services are controlled fixtures; tests perform no production writes. Deployment identity permissions and authenticated live Sheets responses are not inspected by these tests.
