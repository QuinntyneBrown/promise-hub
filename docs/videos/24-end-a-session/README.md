# 24 · End a session

> **Runtime:** ~2 min · **Audience:** contributors and product owners · **Prerequisites:** [23 · Respond to an absence alert](../23-respond-to-an-absence-alert/README.md)

**Video:** [24-end-a-session.mp4](24-end-a-session.mp4) · [Slides](slides.html) · **Audio:** [24-end-a-session.mp3](24-end-a-session.mp3) · [Transcript](script.md)

## Why this video exists

Slice 24 ([prompt](../../prompts/24-end-a-session.md)) lets a site lead reconcile attendance, close the session and leave notes.

## Learning objectives

By the end, the viewer can:

- end a session and choose what happens to the children not checked in and not signed out;
- explain why an ended session is read-only;
- keep session notes.

## Key questions

| Question | What a strong answer includes |
|---|---|
| What happens to children not checked in? | Marked absent, or left as not recorded |
| Can attendance change after the end? | No; writes answer "This session has ended." |
| Who can read the notes? | The next site lead and the director, on the session |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Attendance/EndSessionHandler.cs` | ending and notes |
| `frontend/projects/attendance/src/lib/end-session-dialog/end-session-dialog.html` | the dialog |
| `docs/adr/0022-no-show-alerts.md` | the decision |
| `clips/end-session-phone.mp4` | the running app with the fake API |
| `shots/*.png` | dialog and recorded state |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:45 | Introduction, promises | Two questions |
| 00:45-01:15 | Jaylen ends it | Dialog, recorded, notes |
| 01:15-01:30 | Read-only | Refusals |
| 01:30-02:05 | Testing, recap | Coverage |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter EndSessionTests
cd e2e; npx playwright test tests/attendance/end-session.spec.ts
```

## Pitfalls

- Attendance history and recording an unrecorded session from memory are later slices.

## References

- [WCAG 2.2: Error prevention (legal, financial, data)](https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data)
