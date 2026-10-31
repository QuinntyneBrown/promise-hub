# 90 · Get reminders and track dollars unlocked

> **Runtime:** ~3.4 min · **Audience:** guardians' advocates, staff, contributors and product owners · **Prerequisites:** [89 · Check child benefits](../89-check-child-benefits/README.md)

**Video:** [90-get-reminders-and-track-dollars-unlocked.mp4](90-get-reminders-and-track-dollars-unlocked.mp4) · [Slides](slides.html) · **Audio:** [90-get-reminders-and-track-dollars-unlocked.mp3](90-get-reminders-and-track-dollars-unlocked.mp3) · [Transcript](script.md)

## Why this video exists

Slice 90 keeps a family's benefits coming and shows what they add up to:

- Reminders on the household's own dates (filing taxes, a child turning 6 or 18, each benefit's renewal), each with Turn off.
- Each reminder is sent once at 10:00 on its day, and never late.
- A running total of the dollars unlocked and applied for, by child and stream.
- A signed program webhook that confirms a benefit started and texts the new total.

The requirements are `L2-157` and `L2-158`, with ADR 0083.

## Learning objectives

By the end, the viewer can:

- Say which reminders a benefits check sets and when each is sent.
- Say what stops a reminder, and why one is never sent late.
- Read the total: unlocked, applied for, and by child and stream.
- Say how a started benefit reaches the total and the guardian.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Which reminders? | `LearningBondDatePlanner`: the next March 15 for taxes, 30 days before each child's 6th and 18th birthday still ahead, and each received or applied-for benefit's renewal (`BenefitCatalogueEntry.Renews`). Each has Turn off. |
| When is one sent? | By `LearningBondClaimJob` per organization, from 10:00 local on its day, once, through Messages, with email as the fallback. Never once turned off, without the Benefits consent, or while suspended. A day that passed unsent is missed. A tax reminder sent sets next year's. |
| What is in the total? | Computed per request by `LearningBondTotals` from the household's own records: Learning Bond deposits, and each benefit's confirmed first year, as unlocked; estimates of what was sent as applied for. Split by child as the catalogue's rule weighs them. |
| How does a benefit start? | `POST /learning-bond/webhooks/programs/{program}`, signed under the program's secret and applied once per event id. It records the confirmed amount and texts "{benefit} has started for your family. You've unlocked ${total} so far." |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/LearningBond/LearningBondDatePlanner.cs`, `LearningBondRemindersHandler.cs`, `LearningBondClaimJob.cs` | Reminders |
| `backend/src/PromiseHub.Application/LearningBond/LearningBondTotals.cs`, `LearningBondTotalHandler.cs`, `LearningBondProgramWebhookHandler.cs` | The total and the program webhook |
| `frontend/projects/learning-bond/src/lib/guardian/learning-bond-reminders-page.*`, `learning-bond-total-page.*` | The pages |
| `shots/phone-reminders.png`, `phone-reminder-off.png`, `phone-total-card.png`, `phone-total.png` | On a phone |
| `shots/desktop-total.png`, `desktop-nothing-confirmed.png`, `desktop-no-reminders.png` | On a laptop |
| `clips/reminders-phone.mp4`, `total-phone.mp4`, `total-desktop.mp4` | Screen recordings of the running app against a fake API |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00 | Introduction | Keep the benefits coming |
| 00:20 | Reminders | The household's dates; Turn off |
| 00:54 | Sending | On its day, once, never late |
| 01:29 | The total | Unlocked, applied for, by child and stream |
| 02:06 | Only hers | Computed from her records; no staff view |
| 02:20 | Testing | API and browser tests |
| 02:55 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend run start -- --port 4317
node tools/video-record/record-clips.mjs docs/videos/90-get-reminders-and-track-dollars-unlocked --base http://localhost:4317
node tools/video-audio/generate-audio.mjs docs/videos/90-get-reminders-and-track-dollars-unlocked
node tools/video-build/build-video.mjs docs/videos/90-get-reminders-and-track-dollars-unlocked --no-captions
```

## Pitfalls

- STOP is honoured by the SMS provider until inbound STOP handling exists (ADR 0081).
- A dispatch outage across a reminder's whole day skips that reminder (ADR 0083).
- Each program's webhook needs its secret configured (`LearningBond:Webhooks:{program}`).

## References

- `docs/specs/L2.md`: L2-157, L2-158
- `docs/adr/0083-date-reminders-are-sent-on-their-day-and-the-total-is-computed-from-the-records.md`
- `docs/detailed-designs/learning-bond/remind-and-total-dollars/README.md`
