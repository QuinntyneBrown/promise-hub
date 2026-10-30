# 89 · Check child benefits

> **Runtime:** ~4.3 min · **Audience:** guardians' advocates, staff, contributors and product owners · **Prerequisites:** [86 · Claim the Learning Bond](../86-claim-the-learning-bond/README.md)

**Video:** [89-check-child-benefits.mp4](89-check-child-benefits.mp4) · [Slides](slides.html) · **Audio:** [89-check-child-benefits.mp3](89-check-child-benefits.mp3) · [Transcript](script.md)

## Why this video exists

Slice 89 adds the benefits check after the Learning Bond:

- It has its own consent.
- Its intake reuses what was given and asks at most three facts more, stored encrypted.
- Each benefit comes from the platform's catalogue, with exactly one state and an estimate computed by its rules on the server.
- Each application goes on its own, only when the guardian says so. A program that takes a paper form gets the filled PDF without a full SIN.

The requirements are `L2-153` to `L2-156`, with ADR 0082.

## Learning objectives

By the end, the viewer can:

- Say why the benefits check has its own consent and what it covers.
- Name the three questions and what is reused.
- Read a benefit card: its state, amount, reason and source.
- Say how an electronic application and a paper form are each sent.

## Key questions

| Question | What a strong answer includes |
|---|---|
| What does the Benefits consent cover? | It has its own wording and is one `LearningBondConsent` per child under 18 with scope `Benefits`. It never counts as a Learning Bond consent, and without it every benefits endpoint answers 403. |
| What does the intake ask? | Household size (1 to 15), marital status and the Canada Child Benefit now, plus whether income changed. Separated or Divorced adds who claims each child, and Not sure stops the check for that child. The answers are stored as ciphertext. |
| Where do the states and amounts come from? | `BenefitCatalogue`: federal programs, every province and territory, and Hamilton. Its versioned rules give each benefit exactly one of Apply now, Need a document, Not eligible with a reason, or already received, and the amount per child. Never the model. |
| How is an application sent? | One per benefit. An electronic program is sent by Submit once through `IBenefitChannel` with the review version, with a 202 and an audit entry without a SIN. For a form program, the guardian downloads the filled PDF (the SIN box left blank) and marks it sent. |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/LearningBond/BenefitCatalogue.cs`, `BenefitRule.cs`, `LearningBondBenefitsHandler.cs`, `LearningBondBenefitsAccess.cs` | The catalogue, the consent gate and the states |
| `backend/src/PromiseHub.Application/LearningBond/LearningBondBenefitApplicationHandler.cs`, `LearningBondFormPdf.cs`, `IBenefitChannel.cs` | One application per benefit, and the form |
| `frontend/projects/components/src/lib/benefit-card/` | The library benefit card |
| `frontend/projects/learning-bond/src/lib/guardian/learning-bond-benefits-*.*`, `learning-bond-benefit-review-page.*` | The pages |
| `shots/phone-offer.png`, `phone-consent.png`, `phone-questions.png`, `phone-benefits.png`, `phone-not-eligible.png` | The check on a phone |
| `shots/phone-ocb-review.png`, `phone-ocb-sent.png` | Apply now |
| `shots/desktop-benefits.png`, `desktop-document-uploaded.png`, `desktop-form.png`, `desktop-marked-sent.png` | The form on a laptop |
| `clips/check-phone.mp4`, `apply-phone.mp4`, `form-desktop.mp4` | Screen recordings of the running app against a fake API |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00 | Introduction | Every benefit a family may be missing |
| 00:20 | Offer and consent | The offer, Not now, its own consent |
| 01:00 | Three questions | Reused answers, three facts |
| 01:35 | One state each | The catalogue's rules |
| 02:15 | Apply now | One benefit, one Submit |
| 02:43 | A form | Proof of address, the filled PDF, Mark as sent |
| 03:12 | Testing | API and browser tests |
| 03:50 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend run start -- --port 4317
node tools/video-record/record-clips.mjs docs/videos/89-check-child-benefits --base http://localhost:4317
node tools/video-audio/generate-audio.mjs docs/videos/89-check-child-benefits
node tools/video-build/build-video.mjs docs/videos/89-check-child-benefits --no-captions
```

## Pitfalls

- Estimates are upper amounts by age. PromiseHub does not ask for income, and the page says the estimates use the last tax return.
- Until a program is integrated, `UnconfiguredBenefitChannel` sends nothing and says so (ADR 0082).
- Reminders and the running total come with prompt 90.

## References

- `docs/specs/L2.md`: L2-153 to L2-156
- `docs/adr/0082-the-benefits-check-keeps-its-own-consent-answers-and-one-application-per-benefit.md`
- `docs/detailed-designs/learning-bond/offer-benefits-check/README.md`, `list-and-apply-for-benefits/README.md`
