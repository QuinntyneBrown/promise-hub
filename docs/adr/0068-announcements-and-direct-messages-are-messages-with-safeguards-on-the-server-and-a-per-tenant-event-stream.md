# 0068: Announcements and direct messages are Messages, with safeguards on the server and a per-tenant event stream

- Status: accepted
- Date: 2026-10-28

## Context

Prompt 74 ports Waypoint's announcements (`L2-ENGAGE-006`), mentor and youth messaging (`L2-ENGAGE-007`), minor safeguards (`L2-CONSENT-004`) and near-real-time delivery (`L2-NFR-005`) as `L2-105` to `L2-108`. ADR 0043 places announcements and direct messages in the Messages module. Waypoint has guardian accounts, a lead mentor per cohort, one thread per pair of users and a SignalR hub with bearer tokens; PromiseHub has no guardian accounts (`L1-013`), one mentor per child (`YouthMentor`, L2-062), cookie sessions (ADR 0005) and a consent gate for minors (ADR 0046).

## Decision

- **Announcements are their own rows.** `Announcement` (title, body, optional program, audience, send time, who) and `AnnouncementRead` (one per announcement and member). Youth and mentors are recipients in the app, computed on read from enrollments, `CohortMentor` and `YouthMentor`, so one rule (`AnnouncementRecipients`) decides delivery, visibility and read counts. Staff with Send messages publish; youth and mentors read with the new `ReadAnnouncements` permission.
- **Guardians get a Messages message.** When the audience includes guardians, the announcement queues a Messages-module message to the households of the enrolled children through `MessageWriter`, by text with email for households without a mobile, due at the send time. The send job, the SMS cap (L2-022) and the guardian pages (L2-103) work unchanged.
- **Scheduled means a future send time.** Nothing activates a row: an announcement is visible once `SendAt` has passed, and its guardian deliveries are due then. Drafts, editing and cancelling are deferred.
- **A conversation is a youth and her mentor.** `DirectMessage` records the youth membership, the mentor membership and the sender. Only the youth and her current mentor read and write; a reassigned youth's former mentor loses access. Routes name the youth membership. Conversations need Messages and Mentoring on.
- **Safeguards are on the server.** A minor's conversation is blocked (409, `blocked: consent`) while `ConsentGate` says consent is required and not in force; history stays readable. No other adult can message a youth. Messages are never edited or deleted. Admins and program directors hold the new `SuperviseConversations` permission: they list and read every conversation, read only, and each opening is audited as viewed. Sending is audited with the two names, never the words.
- **Real time is a server-sent event stream.** `GET /realtime` (any member) streams events keyed by organization and membership from an in-process `RealtimeHub` behind the `IRealtimeEvents` port. Events carry ids, never words; pages refetch through the permission-checked endpoints on each event and on every (re)connection. SignalR is not added: `EventSource` sends the session cookie and reconnects without a client package.
- **Deferred.** A mentor's broadcast to a group, recipient estimates and drafts for announcements, an event at a scheduled announcement's time, scale-out of the event stream across API instances, and notifications on the stream (prompt 75).

## Consequences

- Three new tables (`Announcements`, `AnnouncementReads`, `DirectMessages`) in one migration, and two permissions.
- `MessageWriter.Queue` gains an optional due time.
- Turning Messages off hides announcements and conversations (404, routes redirect to Today) and deletes nothing; turning Mentoring off hides conversations.
- A single API instance holds the stream's subscribers; more instances need a shared broker behind the same port.
