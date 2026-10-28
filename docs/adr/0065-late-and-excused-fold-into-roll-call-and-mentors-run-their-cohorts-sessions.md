# 0065: Late and excused fold into Roll Call's check-in model, mentors run their cohorts' sessions, and corrections are audited

- Status: accepted
- Date: 2026-10-28

## Context

Prompt 71 ports Waypoint's attendance capture, offline sync, history and rates (`L2-ENGAGE-002` to `L2-ENGAGE-004`, `L2-NFR-004`, `L2-PLATFORM-012`) as `L2-095` to `L2-099`. Waypoint stores one `AttendanceRecord` per session and youth with a status of Present, Late, Excused or Absent, saved in bulk from a mentor's sheet with an idempotency key and a concurrency stamp, and lets a director edit on the mentor's behalf. PromiseHub already has Roll Call (ADR 0009, ADR 0012): an `AttendanceRecord` per session and child whose status follows check-in (NotYet, Present, Absent, SignedOut), an append-only `AttendanceEvent` per action keyed by a client action id, the offline queue (L2-028), no-show texts and sign-out. ADR 0043 says Waypoint's statuses fold into Roll Call: there is one attendance system, not two.

## Decision

- **Late and excused are qualifiers, not new states.** `AttendanceRecord` gains `Late` and `Excused`. Late is a check-in that came after the start: status Present, `Late` true, kept through sign-out so the history still counts it late. Excused is an absence the organization accepts: status Absent, `Excused` true. Waypoint Present maps to Present (or SignedOut), Late to Present with `Late`, Excused to Absent with `Excused`, Absent to Absent. The status machine, no-show texts, sign-out and end-of-session rules are unchanged.
- **The same endpoints carry them.** `POST /sessions/{id}/check-ins` takes `late` and `POST /sessions/{id}/absences` takes `excused` (both default false). They append `CheckedInLate` and `MarkedExcused` attendance events and audit like any mark. The offline queue keeps the flag and replays it, so offline capture, idempotency and the conflict rule (present wins) need nothing new. Waypoint's bulk save, its receipts and its concurrency stamp are not carried over: each mark is its own idempotent action. Mark the rest present is a client action that sends one check-in per child not yet marked.
- **Mentors run the sessions of their cohorts.** The Mentor role gains `RunSessions` without `RunAnySession`. `SessionAccess` lets a mentor open and run the sessions of programs on whose mentor team they are (lead or supporting, `CohortMentor`, not archived), plus any session they are assigned to. Mentors do not read medical details, Quick Cards or approved pickups; the check-in page hides those links for them. Check-in is in the mentor's navigation while Roll Call is on.
- **One history endpoint.** `GET /attendance?programId=` (Roll Call, new `ReviewAttendance`: admins, program directors, site leads and mentors) answers the cohorts the caller may choose (every active program for staff; the mentor's team cohorts for a mentor), the chosen cohort's sessions that have started and are not cancelled, newest first, with present, late, excused and absent counts, the rate (present or late of marked) and a status (InProgress, NotRecorded, Recorded, NeedsReview), and each child on its active roster with attended of marked, late, excused, absent, rate and a below-70% flag. A mentor asking for another cohort gets 403, audited as AccessDenied. The page is `AttendanceHistoryPage` in the `attendance` library at `/check-in/history`; it replaces the earlier program attendance mock (`attendance`).
- **Corrections are separate and audited.** `PUT /sessions/{id}/attendance/{childId}` with `status` (Present, Late, Excused, Absent) and a required `reason` of at most 500 characters needs the new `CorrectAttendance` (admins and program directors). It works on an ended session, refuses one that has not started or was cancelled, appends a `Corrected` attendance event and audits Updated on `Attendance` with the mark before and after and the reason.
- **Deferred.** Volunteers' Present/Absent subset (prompt 72), attendance badge streaks, a date-range filter and CSV or PDF export of the history (Reports, L2-024), and editing a correction's reason.

## Consequences

- Reports, the mentor's youth record and the youth's progress keep reading Present and Absent; late children count as attended and excused ones as absent.
- Existing check-in clients that send neither flag behave as before.
- Turning Roll Call off answers 404 on the history and corrections and redirects `/check-in/history` to Today; nothing is deleted.
