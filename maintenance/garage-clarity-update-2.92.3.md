# Satori2.92.3 — Clear Garage and visible updates

Frontend-only, live+preview, no Apps Script redeploy.

Updates: busy views now show the existing update banner. In Garage it sits above the interface, reserves its measured height, handles Enter/Space, and respects safe areas. Neither explicit update nor a previously scheduled auto update may interrupt a reservation write.

Layout: Môj deň leads with actual own parking/office/waiting status and direct edit/cancel actions; outside-window records are explicitly unknown. Calendar has one primary confirmation. Map stays visible, preserves real layout/numbers/two roads/right wall and anonymous−1 allocation. Bays shrink180px minimum to128px with smaller cars/empty symbols; people, hours and model remain visible. Exact free windows are embedded below map. Successful status no longer duplicates the refresh action. Allocation/auth/fleet/30day/cached refresh behavior unchanged.

Verification:55 source suites; update VM red/green including delayed auto-reload race; mobile update click/layer/inset/write tests; clarity4roles and widths320/390/1200; existing UI, polling, automatic allocation/cancellation/fleet, pull refresh and all six time fields. Chrome mobile emulation, no physical Safari claim.
