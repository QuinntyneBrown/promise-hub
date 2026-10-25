# 11 · Send permission slips

> **Runtime:** ~3 min · **Audience:** contributors and product owners · **Prerequisites:** [10 · Send guardian messages](../10-send-guardian-messages/README.md)

**Video:** [11-send-permission-slips.mp4](11-send-permission-slips.mp4) · [Slides](slides.html) · **Audio:** [11-send-permission-slips.mp3](11-send-permission-slips.mp3) · [Transcript](script.md)

## Why this video exists

Slice 11 ([prompt](../../prompts/11-send-permission-slips.md)) lets a program director write an event's consent slip, send or schedule it, change it and watch signatures.

## Learning objectives

By the end, the viewer can:

- write a slip and send it now, later or not yet;
- read the answers per child and the Slips list;
- explain when an edit re-opens signing.

## Key questions

| Question | What a strong answer includes |
|---|---|
| How does a slip reach families? | One message per household through the message path, with `Source = Slips` |
| What does a material edit do? | New version, answers superseded, families told to sign again |
| What happens with Slips off? | Endpoints answer 404 and the job leaves scheduled slips unsent |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Slips/SlipSender.cs` | validation and the message |
| `backend/src/PromiseHub.Application/Slips/EditSlipHandler.cs` | small and material edits |
| `docs/adr/0014-permission-slips.md` | the decision |
| `clips/write-and-send-desktop.mp4`, `clips/track-and-edit-phone.mp4` | the running app with the fake API |
| `shots/*.png` | errors and the Slips list |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:55 | Introduction, promises | What a slip is |
| 00:55-01:25 | Write and send | Editor to tracking |
| 01:25-02:00 | Answers and changes | Counts, material edit |
| 02:00-02:20 | When things go wrong | Errors, cap |
| 02:20-03:00 | Testing, recap | Coverage |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter SlipTests
cd e2e; npx playwright test tests/slips
```

## Pitfalls

- The guardian's signing page and links are the next slice; answers in the demo are seeded.
- The sign-by date must fall before the event day in the organization's time zone.

## References

- [Angular router: paramsInheritanceStrategy](https://angular.dev/api/router/ExtraOptions#paramsInheritanceStrategy)
