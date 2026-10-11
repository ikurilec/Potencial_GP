# Market and stock loading — 2.89.29

## Reproduced defects

- Switching Aflamil tablets to sachets inherited the tablet detail's fallback quarter. Each form now starts at the quarter selected when opening the detail.
- Apps Script HTTP 200 replies with `ok:false` or incomplete market arrays bypassed the retry boundary. Read payloads now validate before completion and retry within the existing budget. Authentication failures stop immediately; writes are excluded from read validation.
- The market renderer treated a zero own share as missing data and could repeatedly move to older quarters. Zero is displayed in the summary and own trend; fallback chooses only a quarter actually present in the response. Valid empty replies are cached and displayed as missing published data, with successful verification rather than a transport error.
- A stock subscriber used an unscoped manual failure and nested tracking. It now uses the stock resource identity and one tracked retry boundary. Completion always applies the payload, including unchanged data and shared preloads. Stock preloads also retry once on transient failure.
- Home's header used an old `entry.error` independently from the scoped section rows. Its failure state now derives from the same current summary as those rows. Actual failed sections retain the red state and retry action.

## Source data audit

Local August 2026 KE workbooks for AFLsach, AFLtbl and AFLcrm were extracted without editing them and passed through the current Golem converter and Apps Script compute functions. Every form produced 12 summary months, 4 current-quarter districts and 4 previous-quarter districts. The September 18 local Sheets backup also contained distinct `AFLsach` rows in Summary, Graf and Okresy. No converter or Apps Script edits were needed for these cases.

This confirms the available local data path; the live Sheets contents and each phone's authenticated session were not inspected.

## Verification

- Source regression suite: 35 suites, live and preview source parity, syntax checks.
- New browser regression: form quarter isolation; 8 Golem roles recovering sachet reads; 7 Reagila roles recovering stocks; permanent stock failure with cached content and explicit retry; opening stocks during preload; zero own share and its trend; valid empty market response; 6 Gyn roles with consistent successful Home status.
- Final compiled assets: market performance across 27 line/role cases; 21 Home checks and returns; 489 actual section status transitions; report market loading; success collapse and expanded detail behavior; Android/iPhone mobile touch refresh.
- Tests use controlled backend replies and Chromium mobile emulation. They do not send production writes or replace physical-device testing.

## Release

Live and preview: 2.89.29. Existing Satori styling retained. No Apps Script redeploy required by this frontend release.
