# Satori 2.92.6 — Correct Garage activity

Frontend-only fix in live and preview. No Apps Script redeploy required.

The usage detector now prioritizes the visible Garage over retained medical panels and modal nodes beneath it. Opens, clicks and section duration are classified as Garáž without changing the authenticated source line. Garage entry and normal exit synchronize section timing immediately instead of waiting for two polling ticks. Repeated polling does not reopen an already active section. The activity renderer uses a parking icon for Garáž.

Session clearing closes the active Garage clock once and suppresses the Garage-close screen synchronization during credential teardown. Logout cannot reopen medical analytics after app_close. Clearing has a reentry guard because expiry checks inside usage collection can themselves clear the session. Existing admin exclusion and login/hidden guards are preserved.

Regression coverage includes 18 role/line contexts per source, retained medical overlays, click section labels, exact entry/exit boundaries, polling deduplication, logout/direct clear and built-browser representative/manager flows in all three medical lines for both live and preview. Historical misclassified records remain unchanged: they cannot be reliably distinguished from genuine doctor search activity.
