# 87 · Follow or resume a claim

> **Runtime:** ~4.7 min · **Audience:** guardians' advocates, staff, contributors and product owners · **Prerequisites:** [86 · Claim the Learning Bond](../86-claim-the-learning-bond/README.md)

**Video:** [87-follow-or-resume-a-claim.mp4](87-follow-or-resume-a-claim.mp4) · [Slides](slides.html) · **Audio:** [87-follow-or-resume-a-claim.mp3](87-follow-or-resume-a-claim.mp3) · [Transcript](script.md)

## Why this video exists

Slice 87 follows a Learning Bond claim after Submit:

- The submitted page shows where the application went, what happens next and when to expect the money.
- The provider reports through a signed webhook. Each event is applied once and texted in the household's language.
- A requested document leaves only on Send.
- A claim that can't go on pauses with plain help and reminders at 14 and 30 days, picks up from the link where it stopped, and closes after 180 idle days with its numbers destroyed.

The requirements are `L2-150` and `L2-151`, with ADR 0081.

## Learning objectives

By the end, the viewer can:

- Read the submitted page: the three steps, the deposit window and what was sent.
- Say how a provider event is trusted, applied once and texted.
- Say when a document reaches the provider.
- Say what pauses a claim, what the reminders do, how it resumes and when it closes.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Where does the deposit window come from? | The provider's stated processing days (`RespProvider.ProcessingDaysMin` and `Max`), counted from the day the application was sent, in the organization's time zone. |
| How is a webhook trusted? | An HMAC-SHA256 of the body under `LearningBond:Webhooks:{channel}` in `X-PromiseHub-Signature`, otherwise 401. The application is found by the provider's reference and name, otherwise 404. The module must be on for its organization, otherwise 404. Each event id is applied once (`LearningBondProviderEvent`). |
| What does Carmen get? | The fixed line in her household's language, through Messages, sent to every guardian with a mobile: received, deposited with the amount, or the document needed with the link. |
| When does a document leave? | Only on Send. The upload (a PDF, JPEG or PNG of up to 10 MB) is encrypted and kept. Send decrypts it in memory and sends it once; a repeat answers 202. |
| What happens to a paused claim? | No SIN or no tax return pauses it, and the page links to the right government page. Reminders go out at 14 and 30 days, never after I'm not interested. Giving the missing answer resumes it and cancels the reminders. After 180 idle days it closes as Not completed, its SINs are destroyed and its consent is closed. |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/LearningBond/LearningBondProgressHandler.cs`, `LearningBondWebhookHandler.cs`, `LearningBondGuardianTexter.cs` | The submitted view and the webhook |
| `backend/src/PromiseHub.Infrastructure/LearningBond/HmacProviderWebhookVerifier.cs`, `backend/src/PromiseHub.Api/Endpoints/LearningBondWebhookEndpoints.cs` | The signature |
| `backend/src/PromiseHub.Application/LearningBond/LearningBondDocumentHandler.cs` | Upload and Send |
| `backend/src/PromiseHub.Application/LearningBond/LearningBondPauseHandler.cs`, `LearningBondClaimJob.cs` | Pauses, reminders and the 180-day close |
| `frontend/projects/learning-bond/src/lib/guardian/learning-bond-submitted-page.*`, `learning-bond-paused-page.*`, `frontend/projects/components/src/lib/step-marker/` | The pages and the step marker |
| `shots/phone-submitted.png`, `phone-next-steps.png`, `phone-received.png` | What was sent |
| `shots/phone-document-needed.png`, `phone-document-chosen.png`, `phone-document-sent.png`, `phone-deposited.png`, `phone-deposited-steps.png` | A document and the deposit |
| `shots/phone-no-sin-yet.png`, `phone-paused.png`, `phone-reminder-set.png`, `phone-reopened.png`, `phone-resumed.png` | A pause and picking it up |
| `shots/desktop-submitted.png`, `desktop-no-tax-return.png`, `desktop-paused-tax.png` | On a laptop |
| `clips/sent-phone.mp4`, `document-phone.mp4`, `paused-phone.mp4`, `states-desktop.mp4` | Screen recordings of the running app against a fake API |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00 | Introduction | After Submit |
| 00:18 | What was sent | Three steps, the window, received |
| 01:13 | The webhook | Signed, applied once, texted |
| 01:37 | A document | Chosen, kept, sent on Send; the deposit |
| 02:13 | A pause | How to get a SIN, a reminder |
| 03:02 | Picking it up | Back at Sofía's details |
| 03:08 | Tax and closing | What to do now; 180 days |
| 03:35 | Testing | API and browser tests |
| 04:15 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend run start -- --port 4317
node tools/video-record/record-clips.mjs docs/videos/87-follow-or-resume-a-claim --base http://localhost:4317
node tools/video-audio/generate-audio.mjs docs/videos/87-follow-or-resume-a-claim
node tools/video-build/build-video.mjs docs/videos/87-follow-or-resume-a-claim --no-captions
```

## Pitfalls

- STOP replies are honoured only by the SMS provider until inbound STOP handling exists (ADR 0081).
- A provider's webhook is refused until its secret is configured (`LearningBond:Webhooks:{channel}`).
- A closed claim has no page of its own: reopening the link offers the claim again from consent.

## References

- `docs/specs/L2.md`: L2-150, L2-151
- `docs/adr/0081-provider-webhooks-are-hmac-signed-and-claim-reminders-run-in-the-dispatch-runner.md`, `docs/adr/0079-learning-bond-launches-are-due-rows-the-dispatch-runner-sends.md`
- `docs/detailed-designs/learning-bond/follow-application-progress/README.md`
