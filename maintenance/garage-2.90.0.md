# Satori Garáž — 2.90.0

The existing Satori login now opens a dedicated Garage interface for office/fleet accounts. Management can select Garage alongside its authenticated medical lines. Garage does not change the medical session or expose medical screens to office accounts.

The initial configuration has six spaces numbered 1–6 on floor −3 and two numbered 7–8 on floor −1. The floor plan is explicitly provisional. Each member can configure vehicle brand and colour; occupied spaces display that vehicle for the selected time interval.

Reservations and attendance use a rolling 30-day server window in Europe/Bratislava. Default hours are 08:00–16:30. Attendance can be planned in batches; parking implies attendance, while cancelling only parking preserves attendance. Transfers and reciprocal swaps retain their original allocations until recipient acceptance. Server locks, revisions and command IDs prevent overlapping or duplicated writes. Weekly targets are informative and configurable as 0, 3 or 4 days.

## Private backend installation

The frontend release does **not** deploy Google Apps Script. Prepare the complete private file with `node scripts/build-garage-backend.cjs`, then `node scripts/install-garage-backend.cjs <private-apps-script-folder>`.

1. Replace the existing Golem project source with the complete private `KOD_GOLEM.txt`. The file includes Garage; do not add `KOD_GARAZ.txt` a second time.
2. In the Golem project's Script Properties, configure `GARAGE_GYN_SHEET_ID` and `GARAGE_REAGILA_SHEET_ID` from the respective spreadsheets if users will enter using those source sessions. Exact same-owner GP dual sessions are preferred when available. Missing source configuration returns an explicit error; it never bypasses authentication.
3. Run `garageInstallTrigger()` once in the Golem editor and grant the normal script permission. This is required for automatic notification retries. The idempotent minute trigger processes the persisted outbox.
4. Redeploy the existing Golem web app as a new version, retaining its URL and access settings. Existing Gyn/Reagila projects need no code change for Garage.
5. Enter Garage with an existing Satori administrator, bind the actual employee logins, set weekly attendance targets and assign the fleet manager. New office-only Satori accounts use role `office` in the existing Golem `Pouzivatelia` sheet; no credentials or staff seeds are published in frontend code.
6. Each member enables Garage notifications explicitly in its profile on each phone. Same-owner medical push subscriptions are preserved; reassigned device tokens remove subscriptions belonging to the previous account.

Mutations return the committed snapshot before sending notifications. A separate authenticated request starts delivery after acknowledgement; the minute trigger recovers interrupted or failed sends. Failed recipients back off without blocking later messages. Stable event IDs suppress replayed Garage phone alerts.

## Verification

Source regressions cover date boundaries, collision and membership rules, atomic batches, stale revisions, transfers/swaps, idempotency, vehicle validation, authentic source sessions, chunked persistence and failed notification delivery. Browser regressions cover live/preview office boot, medical isolation, retries/cache privacy, 320/390/1200-pixel layouts, map/vehicle interaction, source-line preservation and visible-only polling. Existing medical management boot and report tests remain part of release verification.

Tests use controlled data. Actual shared reservations and device delivery must be verified after backend deployment; a successful local test is not proof of a deployed server.
