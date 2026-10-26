# 27 · Confirm an exceptional pickup

> **Runtime:** ~2 min · **Audience:** contributors and product owners · **Prerequisites:** [26 · Manage approved pickups](../26-manage-approved-pickups/README.md)

**Video:** [27-confirm-an-exceptional-pickup.mp4](27-confirm-an-exceptional-pickup.mp4) · [Slides](slides.html) · **Audio:** [27-confirm-an-exceptional-pickup.mp3](27-confirm-an-exceptional-pickup.mp3) · [Transcript](script.md)

## Why this video exists

Slice 27 ([prompt](../../prompts/27-confirm-an-exceptional-pickup.md)) lets the guardian approve or refuse someone outside the approved list; a refusal is logged.

## Learning objectives

By the end, the viewer can:

- ask a guardian by text from the sign-out dialog;
- explain what an approval and a refusal do.

## Key questions

| Question | What a strong answer includes |
|---|---|
| How is the guardian asked? | A text linking to the family page, after the code check |
| What does an approval do? | Counts as the guardian's okay at sign-out for that adult |
| What does a refusal do? | Keeps the child, blocks that adult, logs a pickup incident |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Attendance/PickupRequestHandler.cs` | ask, decide, incident |
| `frontend/projects/attendance/src/lib/sign-out-dialog/sign-out-dialog.html` | the answer in the dialog |
| `docs/adr/0024-approved-pickups.md` | the decision |
| `clips/ask-guardian-desktop.mp4` | the running app with the fake API |
| `shots/*.png` | family page and refusal |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:45 | Introduction, promises | Ask, answer, log |
| 00:45-01:10 | Jaylen asks | Approved |
| 01:10-01:30 | When it's no | Refused, incident |
| 01:30-02:05 | Testing, recap | Coverage |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter PickupRequestTests
cd e2e; npx playwright test tests/attendance/exceptional-pickup.spec.ts tests/guardian/pickup-request.spec.ts
```

## Pitfalls

- The incident is only created while the Incident log module is on; the refusal is audited either way.

## References

- [WCAG 2.2: Status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages)
