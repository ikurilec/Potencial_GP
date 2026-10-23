# 2.92.32 — Hide completed verification in Plnenie

The main status could show green while the panel never collapsed. Internal
`getConfig` notification metadata from a previous client run appeared as an
optional displayed section. Main completion ignored it, while the collapse
guard correctly required every displayed section to be current.

Exclude internal config bookkeeping from displayed section definitions in both
frontends. Config requests, caching and notification processing remain active.
Actual displayed sources still prevent collapse while unknown, loading or
failed. The existing two-second success hold and upward height animation remain.

Validation:

- New source regression reproduces the old failure before the fix; checks old
  config history, background config polls, primary pending and primary failure
  across 24 role/line contexts per frontend.
- All 80 source regression suites pass.
- Built browser regression exercises real manager/representative/GYN Plnenie
  view mappings in live and preview at mobile and desktop widths; checks natural
  two-second hold, animated collapse and freed layout space, visible pending and
  failure states, and accessible retry.
- Independent narrow code review found no blockers.

Frontend-only release; no Apps Script deployment required.
