# 09 · Record attendance as a youth worker

> **Runtime:** ~2.5 min · **Audience:** contributors and product owners · **Prerequisites:** [08 · Sign children out](../08-sign-children-out/README.md)

**Video:** [09-record-attendance-as-youth-worker.mp4](09-record-attendance-as-youth-worker.mp4) · [Slides](slides.html) · **Audio:** [09-record-attendance-as-youth-worker.mp3](09-record-attendance-as-youth-worker.mp3) · [Transcript](script.md)

## Why this video exists

Slice 09 ([prompt](../../prompts/09-record-attendance-as-youth-worker.md)) tightens permissions on the most-used flow: youth workers run only the sessions they work.

## Learning objectives

By the end, the viewer can:

- explain who may run which session;
- show what a youth worker sees for her own session and for another;
- say why another organization's session answers 404 rather than 403.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Who runs any session? | Admins, program directors and site leads (`RunAnySession`) |
| What limits a youth worker? | Their `SessionStaff` assignments; Today lists only those |
| What does another session answer? | 403 for the roster and every write, with the page saying whom to ask |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Attendance/SessionAccess.cs` | the scope rule |
| `backend/src/PromiseHub.Domain/Events/SessionStaff.cs` | the assignment |
| `docs/adr/0012-session-staff.md` | the decision |
| `clips/her-session-phone.mp4`, `clips/not-her-session-desktop.mp4` | the running app with the fake API |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:45 | Introduction, rule | Who runs which session |
| 00:45-01:05 | Aisha's night | Her session on the phone |
| 01:05-01:20 | Not her session | The no-access state |
| 01:20-01:35 | Two states | Today and no access |
| 01:35-02:20 | Testing, recap | Coverage |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter SessionAssignmentTests
cd e2e; npx playwright test tests/attendance/assigned-sessions.spec.ts
```

## Pitfalls

- Assignments are seeded for now; managing them arrives with the staff and event editing slices (ADR 0012).
- The tenant check comes before the assignment check, so another organization's session is 404, never 403.

## References

- [ASP.NET Core authorization](https://learn.microsoft.com/aspnet/core/security/authorization/introduction)
