# 18 · Manage waitlists

> **Runtime:** ~2 min · **Audience:** contributors and product owners · **Prerequisites:** [17 · Track enrollment status](../17-track-enrollment-status/README.md)

**Video:** [18-manage-waitlists.mp4](18-manage-waitlists.mp4) · [Slides](slides.html) · **Audio:** [18-manage-waitlists.mp3](18-manage-waitlists.mp3) · [Transcript](script.md)

## Why this video exists

Slice 18 ([prompt](../../prompts/18-manage-waitlists.md)) lets a program director move waitlisted children in when places are free.

## Learning objectives

By the end, the viewer can:

- move a waitlisted child in and tell what the guardian receives;
- explain how positions close up;
- explain what happens when the program is full.

## Key questions

| Question | What a strong answer includes |
|---|---|
| What is Move in on the server? | The Accept decision on a waitlisted request |
| What happens to the others? | Everyone behind moves up one place |
| When is it refused? | When the program is full, with the count |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Enrollment/ReviewEnrollmentHandler.cs` | positions closing up |
| `frontend/projects/enrollment/src/lib/move-in-dialog/move-in-dialog.html` | the dialog |
| `docs/adr/0019-enrollment-review.md` | the decision |
| `clips/move-in-desktop.mp4` | the running app with the fake API |
| `shots/*.png` | full program and phone |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:40 | Introduction, promises | Order and Move in |
| 00:40-01:00 | Marisol moves Kevin in | The dialog and the text |
| 01:00-01:15 | Full and roles | Disabled, refused |
| 01:15-01:50 | Testing, recap | Coverage |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter EnrollmentReviewTests
cd e2e; npx playwright test tests/enrollment/waitlist.spec.ts
```

## Pitfalls

- A guardian can't join a waitlist by themselves yet; a child joins it when the program is full at submission or when staff waitlist them.

## References

- [WCAG 2.2: Label in name](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name)
