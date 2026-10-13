# Garáž 2.90.2

The Garage calendar now displays one complete month with a Monday–Sunday grid. Month arrows allow browsing; attendance and parking commands remain restricted on both client and server to today through today + 29 calendar days in Europe/Bratislava. Browsed months, selected eligible office dates and open form drafts survive background refresh.

Floor −3 uses the supplied physical plan: 587/588, upper access road, 590/589, 612/613, lower access road. Both roads enter from the left and end at the right wall. Floor −1 reserves one of two unnumbered capacity units. Its allocator checks the complete requested interval and repacks hidden assignments without changing booking identity or ownership.

Garage now shares Satori’s header, namedays, avatar, menu and personal settings. Office-only users receive Garage navigation, their own avatar/preferences/password and parking notifications. Medical data, product settings and medical dashboard initialisation remain excluded. Optional birthdays include only active Garage members and expose today/tomorrow notices, never full birth dates.

## Deployment

The central Golem Apps Script must be replaced with the prepared private complete `apps_script/KOD_GOLEM.txt` and its existing deployment updated. No URL, Script Property, trigger or other line deployment change is required. The first authoritative Garage read migrates provisional numbers by stable slot ID under the same lock, preserving reservations and profiles. Custom labels are preserved individually.

Publish both frontend targets and matching 2.90.2 version metadata after backend redeployment. Build order is app, Garage model, Garage UI, shared shell, authenticated integration. All content hashes participate in the PWA shell cache revision.

## Verification

Source regressions cover all existing lines and roles, pure reservation invariants, restricted pool allocation, block release interval unions, migration, cache and own-profile permissions. Browser fixtures exercise monthly/year boundaries, stale-cache rollover, the two floor layouts, 320/390/1200px widths, office-only/shared settings, avatar, menu, login choices and return to medical interfaces. These tests use synthetic accounts and do not write live reservations or prove real-device notification delivery.
