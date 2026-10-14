# Satori 2.92.7 — Stable Garage choice during access verification

Frontend-only live and preview change. No Apps Script redeploy required.

Garage access remains a separate authenticated server check. A previously verified owner and bound source now have a display hint, retained for up to 30 days. During a new check the chooser immediately renders the disabled Garage tile with a spinner and an explicit access-verification label. Success unlocks the existing tile; confirmed denial removes it; failure keeps a disabled tile and the existing retry action. The medical menu follows the same checking/failure behavior.

Hints contain only a boolean and timestamp and are never used by authorization, transport, automatic entry or line-choice eligibility. Unknown accounts retain the generic verification text. Hints are keyed by owner and source; confirmed denial overrides any old snapshot, and revocation clears all owner-source hints. Old installed caches migrate the visual hint from the actual public members projection, which carries the bound source; the projected me object does not carry it. Login reset still removes real grants and aborts old checks; late old-session responses cannot write hints.

Chooser updates retain the outer login card, so finishing access checks cannot restart its entrance animation. Remember-choice state is preserved. Tests exercise rotated credentials, pending manual-entry rejection, fresh server unlock, denial, failure/retry, legacy public projection, source isolation, normal login/restore flows and live/preview admin and area-manager browser scenarios with held server replies. Historical layout hints do not promise that a new or revoked account has access.
