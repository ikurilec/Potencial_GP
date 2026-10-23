# Navigator simplification — design and implementation plan

Approved direction: a simple opening view with main shortcuts and recent items;
search reveals the full authorized catalogue. Applies to Golem, GYN and Reagila,
all existing medical roles. Garage retains its existing separate navigation.

Keep the Satori fonts, navy header, blue focus/actions, white surfaces, control
heights and rounded corners. No new dependencies, backend or authorization rules.

1. Add a browser regression for six primary shortcuts, progressive access to the
   remaining functions, scoped recents, immediate search, clear, focus and layout.
   Confirm it fails before implementing.
2. Update both navigator HTML shells with a labelled title, current line, search,
   clear and close controls. Preserve synchronous input focus for iOS.
3. Refine the existing CSS block for compact shortcuts, readable result groups,
   consistent icons, active/focus/error states and a keyboard-sized scroll area.
4. Refine only rendering and dialog lifecycle. Keep index, routing, filtering,
   asynchronous loaders and account/line guards. Replace the injected global
   verification panel with the navigator's existing truthful inline source state.
5. Run source and existing navigator route/data regressions plus new UI checks
   for live/preview, all lines and roles, narrow/mobile/desktop and keyboard use.
   Inspect screenshots; build, bump version, publish and verify public assets.

No functions or data sources are removed. Secondary routes remain accessible
under “Ďalšie funkcie” and in search; recent items remain scoped to line/account.

## Validation

- New UI regression failed on the old navigator (zero compact shortcuts), then
  passed on the final built release: 144 role/line/view-width cases across live
  and preview. Includes source status without duplicate verification, keyboard
  trap/return, clear search, scoped/capped recents, disclosure, failures/retry,
  44px controls, 320px layout and keyboard-sized viewport.
- Existing built navigator regression passes 18 actual role/line menus, source
  hydration/reuse, accent-free queries, stock routing, direct GP/GYN pharmacy and
  manager doctor routing, failure recovery and stale-account response guards.
- All 80 source regression suites pass.
- Mobile opening/results and desktop screenshots inspected. Mechanical design
  detector found no findings in the changed navigator CSS/HTML region; legacy
  findings elsewhere are outside this task.

No backend changes or Apps Script deployment required. Mobile checks use browser
touch emulation, not physical Android/iOS devices.
