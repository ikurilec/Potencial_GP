# Satori2.92.2 — Mobile Garage discovery

The old entitlement probe aborted after5s without retry, silently hiding Garage for the rest of a mobile login/restore. New probes tolerate Apps Script cold starts (10s, one20s retry), coalesce exact credential keys, and keep access closed until verified. Confirmed NOT_MEMBER is never retried or converted to permission.

Transient failures provide a generic additional-interface recovery action in chooser/menu; reconnect or visible-page return retries failed sources. Results update the exact current/dual/chooser session only. Office-only restore recovery bootstraps Garage; medical recovery preserves its interface. A menu retry is not treated as navigation. Reset/revocation cancels checks and rejects stale responses.

Frontend-only patch, live+preview. No Apps Script redeploy. Regression coverage includes6.2s real delayed browser responses, first-request transient failure, repeated failure and explicit menu recovery after restore, credential coalescing, confirmed denial, owner reset and office-only navigation.
