# Verification lifecycle — 2.92.31

Home previously showed calendar verification starting again each minute. The
shared calendar intentionally polls every 60 seconds, but status summaries treated
every background request as a fresh foreground verification cycle. In addition,
all preference, calendar and Board writes globally invalidated every successful
read. Saving the last-seen Board preference could therefore make unrelated data
need checking again.

## Behavior

- Initial verification remains visible. Cached content stays rendered.
- A successful current source stays settled during routine background polling.
  Poll results still apply and update the real successful check time; no date is
  invented while a response is pending. First checks and recovery remain visible.
- Every Board and Calendar opening explicitly checks the server with `fresh=1`,
  including consecutive openings within 30 seconds. Their content remains visible
  during the request. This is deliberately different from quiet Home polling.
- Closing Board during a request lets that request update the shared Home data
  and settle its loading state. It does not mark posts arriving after closing as
  read. Newer requests and login/line changes still reject obsolete responses.
- Calendar openings, explicit retries, pull refresh and calendar pushes use
  critical fresh requests. Equivalent in-flight requests still coalesce. An older
  reply cannot overwrite a newer sync, an intervening calendar mutation or another
  line's data. Only the latest active sync clears its loading flag.
- Preference writes preserve business-data verification. Calendar writes invalidate
  calendar reads; Board mutations invalidate Board reads. Competitor selections
  invalidate roster/bootstrap responses that can hydrate those selections, while
  preserving unrelated stocks/calendar. Avatar and unknown writes retain the
  conservative global invalidation behavior.
- In-flight identity now includes the relevant mutation revision, so a post-write
  read cannot join an old pre-write request. Existing read age limits, live polling,
  push notifications, role scope and line isolation remain unchanged.

## Validation

`node scripts/test.cjs`: 79 source suites, including 24 role/line combinations per
app source for scoped invalidation, first/foreground/background checks, preserved
timestamps, manual refresh, late responses and competitor-selection hydration.

`node scripts/test-verification-lifecycle-browser.cjs`: 72 built UI cases across
live/preview, mobile/desktop, all three lines and management/representative roles.
Checks quiet polling, foreground attachment to an existing read, server request
counts, consecutive forced Board checks and cached-content preservation.

The Home resume browser regression also passes 21 management/representative
role/line cases, partial failures, manual retry, foreground checks and 320px layout.
The cache-clear browser regression passes 18 live/preview role/line cases.

Frontend-only release. No Apps Script redeployment is required.
