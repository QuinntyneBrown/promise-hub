# 06 · Check children in

> **Runtime:** ~3 min · **Audience:** contributors and product owners · **Prerequisites:** [05 · Create programs and events](../05-create-programs-and-events/README.md)

**Video:** [06-check-children-in.mp4](06-check-children-in.mp4) · [Slides](slides.html) · **Audio:** [06-check-children-in.mp3](06-check-children-in.mp3) · [Transcript](script.md)

## Why this video exists

Slice 06 ([prompt](../../prompts/06-check-children-in.md)) delivers the highest-value daily task: knowing exactly who is here.

## Learning objectives

By the end, the viewer can:

- check children in, record an earlier arrival or an absence, and add a walk-in;
- explain the optimistic update and its revert;
- say why a repeated tap never counts twice.

## Key questions

| Question | What a strong answer includes |
|---|---|
| What is a session? | An event of a program; its roster is the program's (ADR 0009) |
| What happens when the server refuses? | The row and totals revert and a toast names the child |
| How are repeated taps handled? | A client action id per tap, unique per organization |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Attendance/AttendanceWriter.cs` | roster check and idempotency |
| `backend/src/PromiseHub.Application/Attendance/TodaySessionsHandler.cs` | today in the organization's time zone |
| `frontend/projects/attendance/src/lib/check-in-page/check-in-page.ts` | optimistic update and revert |
| `clips/check-in-phone.mp4`, `clips/today-desktop.mp4` | the running app with the fake API |
| `shots/phone-failed.png` | the failure state |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:45 | Introduction, promises | What check-in guarantees |
| 00:45-01:30 | Jaylen at the door | Taps, absence, walk-in |
| 01:30-01:55 | When the network fails | Revert and idempotency |
| 01:55-02:15 | On a laptop | Today and the roster |
| 02:15-03:05 | Roles, testing, recap | Who can do what |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter CheckInTests
cd e2e; npx playwright test tests/attendance
```

## Pitfalls

- A recurring program needs one event per session until schedules generate them.
- Volunteer coordinators read the roster but cannot change it.

## References

- [Angular signals](https://angular.dev/guide/signals)
