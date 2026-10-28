# 71 · Take attendance for cohort sessions

> **Runtime:** ~5.5 min · **Audience:** mentors, site leads, program directors, developers · **Prerequisites:** [06 · Check children in](../06-check-children-in/README.md), [25 · Run check-in offline](../25-run-check-in-offline/README.md), [70 · Schedule sessions and RSVP](../70-schedule-sessions-and-rsvp/README.md)

**Video:** [71-take-attendance-for-cohort-sessions.mp4](71-take-attendance-for-cohort-sessions.mp4) · [Slides](slides.html) · **Audio:** [71-take-attendance-for-cohort-sessions.mp3](71-take-attendance-for-cohort-sessions.mp3) · [Transcript](script.md)

## Why this video exists

Attendance is both a safety record and a funder number. Prompt 71 lets a mentor take attendance for his cohort's sessions in Roll Call, marking each youth present, late, excused or absent, online or offline, and lets staff review a cohort's attendance and rates and correct a mark with an audited reason (`L2-095` to `L2-099`, ADR 0065). Waypoint's statuses fold into Roll Call: one attendance system, not two.

## Learning objectives

By the end, the viewer can:

- Mark a youth late or excused, and mark the rest present, as a mentor or site lead.
- Say how late and excused map onto Roll Call's check-in model.
- Take attendance offline and say what happens when the signal returns.
- Read a cohort's history by session and by youth, and say what the rate counts.
- Correct a mark and say who may, on which sessions, and what the audit keeps.

## Key questions

| Question | What a strong answer includes |
|---|---|
| What is a late mark? | A check-in with a late flag, kept through sign-out |
| What is an excused mark? | An absence with an excused flag; no no-show text |
| Which sessions does a mentor run? | Those of cohorts on his mentor team (lead or supporting), and assigned ones |
| What does the rate count? | Present or late, of those marked |
| Who may correct, and when? | Admins and program directors, on a started, not cancelled session, ended or not, with a reason |
| What is audited? | Every mark with its kind; each correction with the mark before and after and the reason |

## Code / assets on screen

| File | What to show |
|---|---|
| `frontend/projects/attendance/src/lib/check-in-page/`, `check-in-sheet-dialog/` | Late, Excused, the totals' captions, Mark the rest present |
| `frontend/projects/attendance/src/lib/attendance-history-page/`, `correct-attendance-dialog/` | The history and the correction |
| `frontend/projects/components/src/lib/table/` | `ph-table`'s numeric columns and qualifying badge |
| `backend/src/PromiseHub.Domain/Attendance/AttendanceRecord.cs`, `AttendanceMark.cs` | `Late`, `Excused`, `Correct` |
| `backend/src/PromiseHub.Application/Attendance/SessionAccess.cs`, `AttendanceHistoryHandler.cs`, `CorrectAttendanceHandler.cs` | Mentor scope, history, corrections |
| `backend/tests/PromiseHub.Api.Tests/LateAndExcusedTests.cs`, `MentorRollCallTests.cs`, `AttendanceHistoryTests.cs`, `CorrectAttendanceTests.cs` | API acceptance tests |
| `e2e/tests/attendance/late-and-excused.spec.ts`, `mentor-attendance.spec.ts`, `offline-attendance.spec.ts`, `attendance-history.spec.ts` | Browser acceptance tests |
| `shots/` | Mentor Today, the late sheet, the marked roster, all marked, offline and synced, history by session and youth, the correction and its toast, invalid, failed, empty, error, forbidden, Roll Call off; phone and desktop |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:25 | Introduction | A safety record and a funder number |
| 00:25-01:08 | Mentor | Late, excused, Mark the rest present |
| 01:08-01:43 | One system | Flags on Roll Call's check-in model; mentor scope |
| 01:43-02:12 | Offline | Queued, then synced |
| 02:12-02:52 | History | By session and by youth, with rates |
| 02:52-03:12 | Access | Who sees and corrects what |
| 03:12-03:46 | Correct | Absent to Excused, with why |
| 03:46-03:54 | Phone | One column |
| 03:54-04:24 | States | Invalid, failed, empty, error, forbidden, Roll Call off |
| 04:24-04:55 | Testing | API and browser tests |
| 04:55-05:23 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend start -- --port 4317
node tools/video-record/record-clips.mjs docs/videos/71-take-attendance-for-cohort-sessions --base http://localhost:4317
node tools/video-audio/generate-audio.mjs docs/videos/71-take-attendance-for-cohort-sessions
node tools/video-build/build-video.mjs docs/videos/71-take-attendance-for-cohort-sessions --no-captions
```

## Pitfalls

- Looking for a separate mentor attendance sheet: mentors use Roll Call's check-in (ADR 0065).
- Expecting volunteers to mark late or excused: their Present/Absent portal is prompt 72.
- Expecting a date range or export on the history: deferred to Reports (L2-024).

## References

- [`L2-095` to `L2-099`](../../specs/L2.md) · [ADR 0065](../../adr/0065-late-and-excused-fold-into-roll-call-and-mentors-run-their-cohorts-sessions.md) · Designs: [record-attendance](../../detailed-designs/attendance/record-attendance/README.md), [review-attendance](../../detailed-designs/attendance/review-attendance/README.md), [sync-offline-attendance](../../detailed-designs/attendance/sync-offline-attendance/README.md), [sync-attendance-reliably](../../detailed-designs/attendance/sync-attendance-reliably/README.md), [show-offline-sync-state](../../detailed-designs/attendance/show-offline-sync-state/README.md)
