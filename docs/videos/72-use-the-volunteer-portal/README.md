# 72 · Use the volunteer portal

> **Runtime:** ~4.5 min · **Audience:** volunteers, volunteer coordinators, site leads, developers · **Prerequisites:** [31 · Coordinate staff coverage](../31-coordinate-staff-coverage/README.md), [71 · Take attendance for cohort sessions](../71-take-attendance-for-cohort-sessions/README.md)

**Video:** [72-use-the-volunteer-portal.mp4](72-use-the-volunteer-portal.mp4) · [Slides](slides.html) · **Audio:** [72-use-the-volunteer-portal.mp3](72-use-the-volunteer-portal.mp3) · [Transcript](script.md)

## Why this video exists

Volunteers run many sessions, and they should see only what is theirs. Prompt 72 brings Waypoint's volunteer portal into PromiseHub as the shell composed for the Volunteer role (`L2-100`, `L2-101`, ADR 0066): today's assigned session on Today, the next four weeks on Schedule, and attendance for his own session with names and Present or Absent only.

## Learning objectives

By the end, the viewer can:

- Say what a volunteer's navigation and Today show, and what they never show.
- Take attendance as a volunteer and say why Late and Excused are not offered.
- Read a volunteer's schedule and say where it comes from.
- Name the empty, failed, cancelled, forbidden and Roll Call off states.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Is there a volunteer app? | No: the PromiseHub shell for the Volunteer role (Today, Check-in, Schedule) |
| Which sessions does Leo see? | Only those he is assigned to in coverage (`SessionStaff`) |
| What can he mark? | Checked in or absent, and Mark the rest present; late and excused answer 403 (`QualifyAttendance`) |
| What does `GET /sessions/mine` answer? | His assignments that have not ended and start within 28 days, with the roster size, status and today |
| What happens with Roll Call off? | Check-in and Schedule disappear, their routes redirect to Today, the API answers 404 |

## Code / assets on screen

| File | What to show |
|---|---|
| `frontend/projects/today/src/lib/today-page.*` | The volunteer's session cards, No session today, Try again |
| `frontend/projects/attendance/src/lib/my-schedule-page/` | The schedule by day |
| `frontend/projects/attendance/src/lib/check-in-sheet-dialog/` | `CheckInSheetData` and the sheet without Late and Excused |
| `frontend/projects/promisehub/src/app/shell/navigation.ts` | Schedule for volunteers while Roll Call is on |
| `backend/src/PromiseHub.Application/Attendance/MyScheduleHandler.cs` | The schedule endpoint |
| `backend/src/PromiseHub.Application/Attendance/CheckInHandler.cs`, `MarkAbsentHandler.cs`, `Identity/RolePermissions.cs` | `QualifyAttendance` |
| `backend/tests/PromiseHub.Api.Tests/VolunteerScheduleTests.cs`, `VolunteerAttendanceTests.cs` | API acceptance tests |
| `e2e/tests/attendance/volunteer-portal.spec.ts` | Browser acceptance tests |
| `shots/` | Today, the roster, the sheet, all marked, the schedule; phone Today, schedule and roster; no session, error, cancelled, empty, schedule error, forbidden, Roll Call off |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:26 | Introduction | Only what is his; no second app |
| 00:26-01:01 | Today | His session, n youth on the roster, Take attendance |
| 01:01-01:36 | Attendance | Names, Now, Earlier, Mark absent instead, Mark the rest present |
| 01:36-02:08 | Permissions | Late and excused refused; other sessions 403; another organization 404 |
| 02:08-02:35 | Schedule | Today and Assigned by day; `GET /sessions/mine` |
| 02:35-02:54 | Phone | One column, the tab bar |
| 02:54-03:30 | States | No session, error, cancelled, empty, forbidden, Roll Call off |
| 03:30-04:03 | Testing | API and browser tests |
| 04:03-04:27 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend start -- --port 4317
node tools/video-record/record-clips.mjs docs/videos/72-use-the-volunteer-portal --base http://localhost:4317
PYTHON=python3 node tools/video-audio/generate-audio.mjs docs/videos/72-use-the-volunteer-portal
node tools/video-build/build-video.mjs docs/videos/72-use-the-volunteer-portal --no-captions
```

## Pitfalls

- Expecting the staff Today summary for a volunteer: participant roles never call `GET /today`.
- Expecting Late and Excused in a volunteer's sheet: they are for staff and mentors (ADR 0066).
- Expecting volunteer hours or a profile card: deferred.

## References

- [`L2-100`, `L2-101`](../../specs/L2.md) · [ADR 0066](../../adr/0066-the-volunteer-portal-is-the-shell-for-the-volunteer-role-with-present-and-absent-only.md) · Designs: [view-todays-session](../../detailed-designs/attendance/view-todays-session/README.md), [view-upcoming-schedule](../../detailed-designs/attendance/view-upcoming-schedule/README.md), [record-session-attendance](../../detailed-designs/attendance/record-session-attendance/README.md)
