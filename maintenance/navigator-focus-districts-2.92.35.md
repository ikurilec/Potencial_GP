# 2.92.35 — Navigator opening and district destinations

The magnifier now opens the shortcut dialog without starting text editing. Focus
goes to the labelled dialog; the keyboard appears on an explicit input tap.
Clearing recent shortcuts also stays out of typing mode. Ctrl/Cmd+K retains its
explicit keyboard-search behavior. The old delayed autofocus is removed.

Standalone manager district results previously always routed to the first
authorized representative. Svidník could therefore open BAMA. District routes now
resolve against each authorized representative's current territory. Current mapped
territories take precedence over old visit/pharmacy rows. Unmapped territory codes
can use their owned source rows/cached market data. Overlap produces explicit
representative choices and recents preserve the selected representative.

District/representative combinations are rechecked before navigation. District
expansion matches full normalized names (Košice I cannot select Košice II) and
persists through slow server reads rather than expiring after 3.5 seconds. The
selected district scrolls into view once, with request/line guards. Opening another
district context resets the pending target.

Validation includes:

- The opening regression failed on the old autofocus behavior, then passed across
  144 UI role/line/width contexts for live and preview; explicit input taps,
  delayed focus, keyboard shortcuts, focus restoration and recents checked.
- District source regression reproduced Svidník selecting BAMA before the fix.
  Every district in REGION_OKRESY now routes to its matching representative in GP
  and Reagila; scoped/missing/overlapping territory, cached rows, exact names and
  slow arrivals checked for both sources.
- Actual built Svidník navigation tested in GP/Reagila, live/preview, holding data
  beyond the former polling deadline and checking all reads use MI. AM West cannot
  navigate into the East working scope.
- 81 source suites and the existing navigator route/data browser regression pass.

GYN keeps its existing available destinations and shares the focus change.
All browser tests use synthetic accounts; mobile checks use touch emulation.
No Apps Script change or redeployment required.
