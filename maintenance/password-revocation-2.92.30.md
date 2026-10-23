# Password changes and stock converter — 2.92.30

Changing a password in a line's `Pouzivatelia` sheet invalidates sessions created
with the previous password when they next contact that server. This also covers
remembered sessions and Garage requests verified against that source sheet.
Offline/cached views cannot receive a server-side logout until they reconnect.

## Implementation

The three private `KOD_GOLEM.txt`, `KOD_GYN.txt`, `KOD_REAGILA.txt` sources append
a server-only `credential_stamp` column to Sessions on new login. Existing first
nine columns and any custom columns are preserved. SHA-256 binds each stamp to
the random session token, normalized login, source namespace and current trimmed
password. The stamp is never returned in login or API responses. Passwords are
not copied into Sessions. Existing user lookup is memoized only within a request.

Authentication checks the binding before sliding expiry, authorization or cached
data reads. Missing bindings fail closed; this requires one fresh login for old
sessions after initial deployment. An observed mismatch revokes the exact token
after re-reading under a short script lock; a busy lock still denies access.
In-app password changes revoke all of that user's same-line session rows.
No spreadsheet edit trigger is installed: a password edit and reversal without
any intervening request cannot be observed. Old passwords should not be reused.

GYN keeps its `gyn` session namespace. Reagila keeps its historical `gp` namespace
in its own spreadsheet, and its West/East migration guards remain intact. The
central Garage validates the stamp from the source spreadsheet, with no new
cross-project shared secret or access grant.

The frontend handles only explicit session expiry/missing responses from known
backend endpoints with a matching username, device and current token. Late
responses from another login cannot clear the current login. An expired inactive
dual-line credential removes only that credential and its Garage grant. Garage
reads can try another granted source once; mutations are never auto-replayed.
Current-session expiry clears remembered credentials and shows the existing
Satori login prompt above editors, including during the exclusive login screen.

## Stock converter

The private `Sklady/sklady_konverter_core.js` adds product key `tuyory`, label
`Tuyory`, for line `gp` only. Packaging rows and all stock/coverage columns follow
the existing normalization. Missing coverage stays unknown; a product absent
from a report remains `missing_in_report`, not zero stock.

Reopen `Sklady/sklady_konverter.html`, convert the latest report, then replace the
Sklady import with the full output including its header. Existing TSV data does
not change merely because the converter code changed.

## Validation and deployment

- `node scripts/test.cjs`: 77 source suites, private local backends required.
- `node scripts/test-session-rejection-browser.cjs`: 8 built UI cases covering
  live/preview, mobile/desktop, login-screen and open-editor states.
- Actual local 19 October stock report: all four Tuyory packaging rows matched.
- Backups of all three original sources and original converter are retained in
  the primary workspace's private `.tmp/password-stock-backup-20261023/` folder.
- Frontend requires the normal build and version publication for live + preview.
- All three Apps Script web-app deployments require a new version of their
  corresponding private source, retaining each existing deployment URL and access
  settings. Deploy frontend first so legacy-session rejection gives a clear login
  prompt. No new user passwords, accounts, scopes or permissions are necessary.
