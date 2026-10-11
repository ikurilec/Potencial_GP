# Stav údajov na dátových obrazovkách

Approved scope: extend the existing Home disclosure to all data views and all existing roles/lines, using Satori styling, green successful checks, red failed checks and a pending spinner. Cached content remains visible. Prepare the matching preview/live release with a version update after verification. Publication is verified separately after pushing.

- [x] Add failing tests for generic read sections, batch/product isolation, success/failure/pending/unknown states and preserved verification times.
- [x] Reuse read metadata and the request queue. Define Slovak section labels for existing endpoints; show required primary data and only requested supplemental data. Separate products/quarters for multi-resource panels.
- [x] Extend disclosure rendering and semantic color states. Unknown data must remain neutral; pending/retry must not become green until a valid response. Preserve expanded state and animation identity.
- [x] Include navigator and manager visit/detail resources that currently lack tracking; preserve editable forms and role scopes. Complete existing retry routes for shown supplemental resources.
- [x] Run unit suites and mobile browser matrices covering all data views, representative/manager roles and three lines. Verify navigation, failed/empty/slow reads, actual retry, cache preservation and small-screen layout.
- [x] Synchronize both sources, bump version and build; validate content hashes/service worker and prepare the release.

Implementation stays in existing app.js/app.css and their nahlad counterparts. No backend endpoint or privilege changes are required. Browser tests use fixtures; actual delivery/physical device conditions remain outside their coverage.

Additional user steering: avoid redundant rechecks on short screen returns. Implemented bounded successful response reuse, scoped to account/line/role/login epoch, with short collaborative windows, preserved check times, selective Home refresh and forced refresh after manual actions or writes. Fast-return animation cleanup was also repaired after reproducing a hidden Home.
