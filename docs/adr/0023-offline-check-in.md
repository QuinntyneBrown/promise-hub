# 0023: Offline check-in keeps the last roster and Quick Cards on the device and replays queued actions in order

- Status: accepted
- Date: 2026-10-25

## Context

Prompt 25 keeps check-in and Quick Cards working without signal and syncs what was done when signal returns (`L2-028`). The design proposed a service worker data group and an IndexedDB queue with a batch sync endpoint.

## Decision

- **Cache.** The API client (`OfflineStore`, in the `api` library) saves the last `sessions/today`, each roster and each Quick Card it loads in `localStorage` with the time saved. When a read fails for lack of signal (HTTP status 0), the client answers the saved copy marked with `savedAt`, or the new `offline` load status when nothing was saved. Opening a roster online loads every Quick Card on it, so each opens later without signal. No service worker yet: the app shell must already be open.
- **Queue.** A check-in or absence that fails for lack of signal is queued on the device and the write answers the new `queued` outcome; the roster row shows "waiting to sync" and sign-out is disabled for it. On the browser's `online` event, `AttendanceApi.sync()` replays the queue in order through the existing per-action endpoints and stops at the first network failure. The server already keys each action by its client action id, so a replay is applied once; no batch endpoint is needed.
- **Conflict.** When a check-in whose arrival time is earlier than an absence another device recorded reaches the server, both events are kept, present wins, `AttendanceRecord.HasConflict` is set, the audit entry says so, and the roster row shows "Conflict: marked absent on another device".
- **Components.** `ph-sync-chip` (design system: sync-status) shows "1 queued" and "Saved on this phone"; the offline notice uses `ph-alert` (warning).

## Consequences

Opening the app cold without signal needs a service worker, a later step. A device's queue lives in that browser only. The offline-queue dialog and a stale-roster warning are not built yet.
