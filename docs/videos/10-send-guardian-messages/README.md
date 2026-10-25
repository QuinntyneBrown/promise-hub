# 10 · Send guardian messages

> **Runtime:** ~3.5 min · **Audience:** contributors and product owners · **Prerequisites:** [09 · Record attendance as a youth worker](../09-record-attendance-as-youth-worker/README.md)

**Video:** [10-send-guardian-messages.mp4](10-send-guardian-messages.mp4) · [Slides](slides.html) · **Audio:** [10-send-guardian-messages.mp3](10-send-guardian-messages.mp3) · [Transcript](script.md)

## Why this video exists

Slice 10 ([prompt](../../prompts/10-send-guardian-messages.md)) lets a program director reach families by text and email within the monthly SMS cap.

## Learning objectives

By the end, the viewer can:

- compose a message to a program or event and read the live count and SMS price;
- read a message's delivery and spot a failed household;
- explain what happens to texts at the SMS cap.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Who receives a message? | Each household's primary guardian, by text or email per the chosen channel |
| How is a send kept to once? | The per-tenant job saves each delivery after sending it; reruns skip it |
| What happens at the cap? | Texts go by email when the household has one and are paused otherwise; email continues |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Messaging/SendQueuedDeliveriesHandler.cs` | the send job and the cap |
| `backend/src/PromiseHub.Application/Messaging/AudienceResolver.cs` | households and channels |
| `docs/adr/0013-guardian-messages.md` | the decision |
| `clips/compose-and-send-desktop.mp4`, `clips/email-failure-phone.mp4` | the running app with the fake API |
| `shots/*.png` | the list and a message with a failure |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:55 | Introduction, promises | What sending guarantees |
| 00:55-01:30 | Marisol writes and sends | Count, preview, delivery |
| 01:30-02:00 | At the cap | Texts off, email on, a failure |
| 02:00-02:10 | States | List and message |
| 02:10-03:20 | Testing, recap | Coverage |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter MessagingTests
cd e2e; npx playwright test tests/messaging
```

## Pitfalls

- Providers are not chosen yet: the app logs accepted sends and tests use fakes (ADR 0013).
- Scheduling, replies, webhooks and translation are later slices; the body is sent as written.

## References

- [GSM 03.38 character set](https://en.wikipedia.org/wiki/GSM_03.38)
