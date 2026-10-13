# Satori 2.92.1 — Garáž

Frontend release for live and preview. No Apps Script redeploy or account migration.

- Garage owns a scoped pull-to-refresh route in each tab; a persistent toolbar offers manual refresh. Reads coalesce and retain cached content, dates, open details, profile drafts and open forms. Errors keep available data and allow retry.
- Calendar badges count physical places free throughout the selected interval (default 08:00–16:30). Clock marker means partial occupancy; selected-day details list actual bookings and exact free gaps. Shared floor −1 capacity uses the authoritative pool model; badges grant no booking permission. Outside the 30-day window no fabricated availability is displayed.
- All six interval contexts use native hour/minute scroll-snap wheels: office, day map, personal reservation, fleet car, defaults, blocking. Confirmation reads the actual scroll position; cancellation, parent navigation and account changes cannot apply an obsolete draft.
- Root/preview build includes both modules in dependency order and PWA cache fingerprint.

Validation: 53 source regression suites; 29 availability tests with 520 independent oracle cases; browser suites for trusted Garage pull gestures, wheel touch/keyboard, integrated calendar/time contexts, core UI/polling, four-role auto parking, fleet/access, shell and interface chooser. Chrome emulation covers Android/iPhone user agents and 320/390/1200 layouts; no physical Safari certification.
