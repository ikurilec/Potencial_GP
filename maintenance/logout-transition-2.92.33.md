# 2.92.33 — Prevent the Golem form flashing on logout

Session clearing previously reset Garage and its boot screen before the next
document established the exclusive login layout. Removing Garage could uncover
the base medical form while navigation was pending; a finishing boot could also
set `.app` visibility back to visible.

Both frontends now activate the existing exclusive login layout, show the login
screen and dismiss a stale interface chooser before any session teardown.
Signed-in views therefore stay outside the layout throughout a delayed reload,
including late boot completions. Existing session storage clearing, server logout,
Garage cleanup, activity tracking and session-expired dialog behavior remain.

Validation:

- A new browser regression fails on the previous code with medical content still
  visible after confirming logout while reload is held.
- The corrected code passes 66 logout scenarios across live/preview and widths
  390, 412 and 1280, sampling animation frames during a held reload and checking
  the following real document reload. Includes representatives, managers, all
  medical lines, Garage office/fleet/admin, GYN Settings, cancellation, expiry and
  late boot completion.
- All 80 source regression suites pass.
- Existing built session-rejection and Garage activity browser regressions check
  expiry-dialog visibility and activity/session cleanup.

Browser tests use isolated synthetic accounts and requests. Mobile coverage is
browser touch emulation, not testing on physical Android/iOS devices.

Frontend-only release; no Apps Script redeploy required.
