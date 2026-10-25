# 23 · Respond to an absence alert

> **Runtime:** ~2 min · **Audience:** contributors and product owners · **Prerequisites:** [22 · Follow up no-shows](../22-follow-up-no-shows/README.md)

**Video:** [23-respond-to-an-absence-alert.mp4](23-respond-to-an-absence-alert.mp4) · [Slides](slides.html) · **Audio:** [23-respond-to-an-absence-alert.mp3](23-respond-to-an-absence-alert.mp3) · [Transcript](script.md)

## Why this video exists

Slice 23 ([prompt](../../prompts/23-respond-to-an-absence-alert.md)) lets a guardian answer a no-show text by replying or on the family's page.

## Learning objectives

By the end, the viewer can:

- answer a no-show text from the guardian home;
- explain how both answers reach the roster.

## Key questions

| Question | What a strong answer includes |
|---|---|
| How can a guardian answer? | Reply 1 or 2, or the buttons on the home page |
| Are they the same? | Yes; both go through `NoShowReplyHandler.ApplyAsync` |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Guardian/GuardianHomeHandler.cs` | open alerts and the answer |
| `frontend/projects/guardian/src/lib/guardian-home-page/guardian-home-page.html` | the alert |
| `docs/adr/0022-no-show-alerts.md` | the decision |
| `clips/answer-phone.mp4` | the running app with the fake API |
| `shots/*.png` | the alert and the roster |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:40 | Introduction, promises | One number or one tap |
| 00:40-01:00 | Linh answers | Code to answer |
| 01:00-01:15 | The roster | Answers per row |
| 01:15-01:50 | Testing, recap | Coverage |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter NoShowTests
cd e2e; npx playwright test tests/guardian/absence-reply.spec.ts
```

## Pitfalls

- The text is in English; the page follows the household's language.

## References

- [WCAG 2.2: Target size (minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)
