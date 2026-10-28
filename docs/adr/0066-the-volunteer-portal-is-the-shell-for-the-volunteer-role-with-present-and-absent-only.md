# 0066: The volunteer portal is the shell composed for the Volunteer role, with its own schedule endpoint and Present or Absent only

- Status: accepted
- Date: 2026-10-28

## Context

Prompt 72 ports Waypoint's volunteer portal (`L2-VOLUNTEER-001`, `L2-VOLUNTEER-002`) as `L2-100` and `L2-101`. Waypoint has a separate volunteer app with three endpoints under `/api/volunteer` (today, schedule, roster) and a Present/Absent bulk save. ADR 0043 already made Volunteer a participant role that holds `RunSessions` without `RunAnySession`, so `SessionAccess` limits a volunteer to the sessions he is assigned to in coverage (`SessionStaff`), and put Today and Check-in in his navigation. ADR 0065 left volunteers' Present/Absent subset to this prompt.

## Decision

- **No separate app or `/volunteer` endpoints.** Today for the Volunteer role shows a card per session he is assigned to today from Roll Call's `GET /sessions/today` (already scoped by `SessionAccess`, with the roster counts), and his check-in is Roll Call's check-in page. Waypoint's volunteer roster query is not needed: the roster already omits medical fields for roles without `ReadMedical`.
- **One new read: `GET /sessions/mine`.** `MyScheduleHandler` (`Attendance/`) answers the caller's own assignments that have not ended and start within 28 days, soonest first, with the program, the organization's calendar day, the roster size, the event's status (Scheduled, Cancelled, Ended) and whether it is today. It is gated by Roll Call and `RunSessions`, starts from the caller's membership, never from a client id, and is tenant-filtered like every query. Waypoint's derived "attendance taken" status is replaced by the event's own status. The page is `MySchedulePage` in the `attendance` library at `/my-schedule`; Schedule is in the volunteer's navigation while Roll Call is on. The existing `/coverage/mine` (a 14-day staff view with the crew, not module-gated) stays as it is.
- **Present or Absent only.** A new permission `QualifyAttendance` (admins, program directors, site leads, youth workers and mentors) is required to send `late` on a check-in or `excused` on an absence; `CheckInHandler` and `MarkAbsentHandler` answer 403 without it before writing. The check-in sheet offers Late and Excused only to roles that hold it. Mark the rest present is Waypoint's "all present".
- **Words for the role.** A volunteer who opens a session he is not assigned to reads "You’re not assigned to this session" and who to ask (his volunteer coordinator).
- **Seed.** Leo Martins is also assigned to Saturday Sports so his schedule shows more than tonight.
- **Deferred.** Waypoint's volunteer hours and profile card, confirming an assignment, the lead mentor's name on the card and room-change notices. Volunteers keep Roll Call's walk-ins, session notes and ending a session as youth workers have them.

## Consequences

- Volunteers, mentors and staff share one attendance system; a volunteer's marks are audited and replayed offline like any other.
- Existing clients that never send `late` or `excused` behave as before for every role.
- Turning Roll Call off removes Check-in and Schedule from the volunteer's navigation, redirects `/check-in` and `/my-schedule` to Today and answers 404 on the session endpoints; nothing is deleted.
