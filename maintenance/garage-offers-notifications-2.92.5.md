# Satori 2.92.5 — Visible offers and notification routing

Frontend-only release for live and preview. No Apps Script redeploy required.

Own personal parking offers are available directly in Môj deň and Moje dni. All Garage roles have a visible Ponuky tab with an actionable incoming count. Incoming offers appear near the top of Garage, with sender, date, place, hours and explicit accept/decline actions. Offer history distinguishes received and sent offers; expired, missing, out-of-window and fleet-car reservations cannot be accepted through the UI. Server validation remains authoritative for revisions, access, expiry and interval conflicts.

The phone-alert activation button is also available in Ponuky. Browser permission alone is not treated as a Garage subscription. Offers are persisted server-side and available inside Garage without a phone push subscription. Existing polling/foreground refresh updates the inbox.

Background Garage pushes refresh data while preserving the active screen and forms. Foreground banners provide a scoped open action: offer notices open Ponuky, other Garage notices open the notified day. Explicit navigation closes non-saving dialogs; navigation during a write waits until successful commit. Failed writes retain the retry form, cancel deferred navigation, and session/reset/close discards deferred routes. Legacy medical banners keep their two-argument behavior.

Tests exercise four roles, ownership until server-confirmed acceptance, targeted notification audiences, Garage-only push tokens, durable retry, successful-delivery deduplication, persisted inbox without push, old-session CTA isolation, expiry, dialog/write routing, medical banner compatibility and 320/390/1200 widths. Existing Android/iPhone gesture, shared shell, login/restore and update tests also run against live and preview.

No real notification was sent to colleagues during verification. Backend tests use synthetic Sheets and mocked external delivery. Actual phone delivery still requires that device's notification permission, Garage registration and the deployed FCM configuration/trigger.
