# 0064: Weekly sessions are a series of events, and an RSVP is one row per event and youth

- Status: accepted
- Date: 2026-10-28

## Context

Prompt 70 ports Waypoint's session scheduling and RSVP (`L2-ENGAGE-001`, `L2-ENGAGE-005`) as `L2-093` and `L2-094`. Waypoint saves a `Session` per cohort with a mentor, materialises one row per week through the cohort's term end when it repeats weekly (sharing a recurrence group id), shows month, week and agenda views, and lets a youth in the session's cohort RSVP going, maybe or can't make it with a note and a reminder. PromiseHub already has events of programs (ADR 0008) read by Roll Call and Slips, calls a cohort a program (ADR 0043), keys youth on the child their membership links to, and has no per-tenant scheduler for reminders yet.

## Decision

- **A session is an event.** No second calendar or session table. Repeating weekly is a create-time option on `POST /events` (`repeatsWeekly`): the handler saves one `Event` per week at the same wall-clock time in the organization's time zone, from the start through the program's last day (`EndsOn`) inclusive, each carrying the same `SeriesId`, and adds a draft slip to each when the event needs one. A series starting after the program's last day is refused (422 on `startsAt`); more than 60 sessions is refused (422 on `repeatsWeekly`). The series is audited once as Created on `Event` with how many sessions. Editing or cancelling changes one session; editing or cancelling a whole series is deferred.
- **One calendar endpoint.** `GET /events/calendar?month=yyyy-MM&programId=` (Roster, every staff role through the fallback) answers the month and its events by the organization's calendar day (`day`), so the grid never depends on the viewer's clock. With no month it answers the organization's current month. The page is `EventsCalendarPage` in the `events` library at `/events/calendar`, composed from a new `ph-calendar` component (design system: calendar) that renders the month as a captioned table and, below 640px, as an agenda of the days with sessions.
- **One RSVP per event and youth.** `EventRsvp` (`PromiseHub.Domain/Events/`) carries the organization, the event, the child, the answer (`RsvpResponse`: `Going`, `Maybe`, `CantMake`), an optional note of at most 500 characters and when it was answered. Answering again replaces the answer and note. RSVPs close when the session starts, ends or is cancelled (409).
- **The youth's schedule.** `GET /schedule` and `PUT /schedule/{eventId}/rsvp` need Roster, the new `RespondToSessions` permission (Youth only) and the guardian consent gate (ADR 0046). The schedule lists events of programs the youth's child has an active enrollment in that have not started and start within 28 days. An event of a program she is not on answers 403 (audited as AccessDenied); another organization's or an unknown event answers 404. Each RSVP is audited as Created or Updated on `EventRsvp` with the answer, never the note. The page is `YouthSchedulePage` in the `events` library, exported as `scheduleRoutes` and mounted at `/schedule` under Roster, because it reads the roster and events (as search is mounted under Roster from `households`, ADR 0028); Schedule is a Youth navigation section while Roster is on.
- **Staff read the counts and notes on the event.** `GET /events/{id}` gains `rsvps`: going, maybe, can't make it, and no reply (children on the program's active roster with a youth account who have not answered), and each answer with the youth's name, answer, note and when, newest first. The note is for the staff who run the session; it is not sent to a mentor.
- **Deferred.** A reminder before the session (Waypoint's criterion 3) waits for near-real-time notifications and a per-tenant scheduler (prompt 75); notifying staff of a note, a mentor's calendar (mentors do not use the staff app) and editing a whole series are deferred.

## Consequences

- Roll Call, Slips and reports see every weekly session as an ordinary event, with no change.
- Turning Roster off answers 404 on the calendar, the schedule and RSVPs; nothing is deleted, and turning it on restores them.
- A youth who leaves the program stops seeing its sessions; answers she already gave are kept and still listed on the event.
