# 0069: Notifications follow their modules, reach the stream on save, and are chosen per person and kind

- Status: accepted
- Date: 2026-10-28

## Context

Prompt 75 ports Waypoint's notifications (`L2-ENGAGE-008`), near-real-time delivery for notifications (`L2-NFR-005`) and notification preferences (`L2-PLATFORM-003`) as `L2-109` to `L2-111`. PromiseHub already has a notification center (`Notification`, L2-040, ADR 0029) with kinds that follow their module, an event stream for messages and announcements (`GET /realtime`, ADR 0068), and organization-wide notification settings (ADR 0030). Producers add notices in several handlers, some through `NotificationWriter` and some directly. Waypoint keys preferences by user and event key with an in-app and an email switch, sends a SignalR message carrying the notice, and has push and quiet hours.

## Decision

- **One writer for every notice.** `NotificationWriter` gains `NotifyMembersAsync` for named members beside the permission-based `NotifyAsync`; every producer (grades, quiz approvals, badges, assigned work, direct messages, announcements, incidents, at-risk flags, data requests, invitations) goes through it, so preferences apply in one place.
- **New kinds.** `assignments` (assigned work, Learning and Mentoring), `messages` (a direct message, Messages and Mentoring) and `announcements` (an announcement sent now, Messages) join `incidents`, `learning`, `mentoring`, `requests` and `staff`. A kind may need several modules; `NotificationKinds` holds the one table of kind, modules, who receives it and its words for the preferences page. A message notice names the sender, never the words.
- **The stream is told on save.** An EF Core save interceptor (`NotificationEvents`) publishes a `notification` event with no content to the recipient after a save that adds a notice, and to the reader after a save that reads one, so every producer and every read reaches the bell and the center of each open device without each handler remembering to. The page refetches through `GET /notifications`.
- **Preferences are per membership and kind, in the app only.** `NotificationPreference` (organization, membership, kind, in app) stores only what a person changed; a missing row means on. `GET /notifications/preferences` offers the kinds the caller's role or permissions receive whose modules are on; `PUT` refuses others with 422, saves and is audited. A module that is off hides its choices and keeps them.
- **Preferences live on their own page.** Your account links to `/account/notifications` in the account library, a form screen, so the account page keeps no inline form.
- **Deferred.** The optional email channel per kind, push and quiet hours, due-soon and session reminders, notices to a mentor when work is submitted or a quiz needs approval, a notice at a scheduled announcement's send time, and the youth onboarding defaults.

## Consequences

- One table (`NotificationPreferences`) in one migration; the interceptor is registered with the DbContext.
- The stream now carries a `notification` event beside the `conversation` or `announcement` event of the same action; a client handles each by name and must not rely on their order.
- The shell's bell and the center follow the stream; a single `EventSource` per tab is shared by every subscriber.
