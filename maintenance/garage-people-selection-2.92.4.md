# Satori2.92.4 — Office colleagues and clear date selection

Frontend-only live+preview. No Apps Script redeploy.

Office roster moves directly below Môj deň. Three names and actual attendance hours are visible immediately; further colleagues expand under the same card. Date and count are explicit; outside the30day snapshot window is unknown rather than empty.

Calendar aria-pressed now means actual unsaved selection; viewed date has a separate outline. Blue draft and confirmed office states have a legend. Selected dates appear as removable chips; clear-selection only clears the local draft. Arrival cancellation remains a separate server-confirmed action for previously stored dates. Draft removal is disabled during writes. Extra fleet cars no longer label the creator as having personal parking.

Authentication, allocation, data reads, calendar bounds, roles and always-visible compact map remain unchanged. Tests cover all4Garage roles, roster sorting/actual hours/6person expansion, date change, scoped refresh, empty versus outside-window, draft-only removal/clear, personal-versus-fleet distinction and widths320/390/1200.
