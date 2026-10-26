# 0029: In-app notifications are rows per recipient, hidden with their module, and the bell opens the center

- Status: accepted
- Date: 2026-10-26

## Context

Prompt 35 asks staff to open tasks, alerts and updates from the bell and a notification center (`L2-040`). The top bar already had a bell with an unread input and nothing behind it. The layout has no notifications feature library.

## Decision

- **Model.** `Notification` (tenant-owned) has a recipient membership, a kind, text, a link, a creation time and a read time. `NotificationWriter` adds one row per current staff member whose role holds a permission; the producer saves it with its own change.
- **First producer.** Reporting an incident notifies everyone who may review incidents (`ReviewIncidents`). Enrollment, bounce, slip and cap notices are later producers on the same writer.
- **Modules.** Each kind names its module; `GET /notifications` leaves out notices of a module that is off and counts only the rest, so turning the module back on restores them.
- **API.** `GET /notifications`, `POST /notifications/{id}/read` and `POST /notifications/read-all` act on the caller's own rows only; someone else's id answers 404.
- **Frontend.** `NOTIFICATIONS_API`; the shell reads the unread count after every navigation, so a read on one device shows on the others on their next page. The bell opens the center at `/notifications`, which lives in the `today` library as `notificationRoutes`. The bell panel (`bell`) is deferred; the center covers it.

## Consequences

Counts refresh on navigation, not by push. Email digests and preferences arrive with prompt 36.
