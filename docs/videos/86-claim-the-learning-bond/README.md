# 86 · Claim the Learning Bond

> **Runtime:** ~5.5 min · **Audience:** guardians' advocates, staff, contributors and product owners · **Prerequisites:** [85 · Launch Learning Bond invitations](../85-launch-learning-bond-invitations/README.md)

**Video:** [86-claim-the-learning-bond.mp4](86-claim-the-learning-bond.mp4) · [Slides](slides.html) · **Audio:** [86-claim-the-learning-bond.mp3](86-claim-the-learning-bond.mp3) · [Transcript](script.md)

## Why this video exists

Slice 86 lets a guardian claim the Canada Learning Bond from the invitation link on a phone, with no account. The steps are:

- a device code first;
- consent for each child;
- the guardian's SIN, the child's SIN and one tax question, asked once, encrypted, and shown only as the last three digits;
- an estimate from a rule;
- a pre-filled application to a recommended no-fee RESP provider, which leaves only when the guardian taps Submit.

The requirements are `L2-144` to `L2-149` and `L2-159`, with ADR 0076 and ADR 0080.

## Learning objectives

By the end, the viewer can:

- Say what a guardian sees before and after the device code, and in which language.
- Explain why consent is per child and separate from program consent.
- Say how a SIN is checked, stored, shown and reused.
- Work out an estimate from a birth year, and say what pauses a claim.
- Say what the review recommends and why, what can be edited, and what Submit guarantees.

## Key questions

| Question | What a strong answer includes |
|---|---|
| What opens from the link? | `GET /g/learning-bond/{token}/page` is answered in the household's language once the device is trusted (401 with the code step before). It shows covered children under 18 with "up to" amounts, and 18 to 20 year olds claim for themselves. Not now and I'm not interested are offered. With the module off the answer is 404. |
| How is consent recorded? | `POST …/consents` stores one `LearningBondConsent` per ticked child, with scope `LearningBond`, the typed name, the wording version and the language, and it is audited. 422 means no child was ticked or no name was typed. |
| How is a SIN handled? | `PUT …/children/{childId}/intake` checks nine digits and Luhn, and rejects a leading 0 or 8 or the same number twice. The number is encrypted by `ILearningBondCipher` with a key outside the database and is never logged. Only its last three digits come back. The guardian's SIN and tax answer are reused for a second child. |
| Where does the estimate come from? | `LearningBondRule.Current`: $500, then $100 a year to 15, at most $2,000, for children born in 2004 or later. The rule's version is recorded on the claim. With no tax return the claim pauses. |
| What does Submit guarantee? | Nothing leaves before it. It must quote the review's current version (otherwise 409). `SubmissionKey` is written before the channel is called, so the application is sent once and a repeat answers 202. A refusal answers 502 and the application stays ready to submit. It is audited without a SIN. |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/LearningBond/LearningBondGuardianHandler.cs`, `LearningBondConsentHandler.cs`, `LearningBondIntakeHandler.cs`, `LearningBondEstimateHandler.cs` | The page, consent, intake and estimate |
| `backend/src/PromiseHub.Application/LearningBond/LearningBondApplicationHandler.cs`, `LearningBondSubmitHandler.cs`, `RespProviders.cs`, `IRespProviderChannel.cs` | The review and Submit |
| `backend/src/PromiseHub.Application/LearningBond/LearningBondHomeCard.cs` | The card on the guardian home |
| `frontend/projects/learning-bond/src/lib/guardian/` | The guardian pages and the Edit and Choose another dialogs |
| `shots/phone-code.png`, `phone-learning-bond.png`, `phone-consent.png`, `phone-consent-recorded.png` | The link, the code and consent |
| `shots/phone-intake.png`, `phone-estimate.png`, `phone-review.png`, `phone-edit-address.png`, `phone-sent.png`, `phone-home-card.png` | The claim on a phone |
| `shots/phone-learning-bond-es.png`, `phone-consent-es.png` | In Spanish |
| `shots/desktop-review.png`, `desktop-choose-provider.png`, `desktop-not-sent.png`, `desktop-no-provider.png`, `desktop-no-tax-return.png` | On a laptop, and the failures |
| `clips/link-phone.mp4`, `claim-phone.mp4`, `spanish-phone.mp4`, `states-desktop.mp4` | Screen recordings of the running app against a fake API |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00 | Introduction | Five steps on a phone |
| 00:17 | The code | The link and the six-digit code |
| 00:54 | What it is | Three sentences and the children |
| 01:07 | Consent | One box per child |
| 01:37 | Details | Two SINs and the tax question |
| 02:24 | Estimate | One number from a rule |
| 02:40 | Review | The provider and the fields |
| 03:11 | Submit | Sent once; the home card |
| 03:40 | Spanish and failures | En español, not sent, no provider, no tax return |
| 04:27 | Testing | API and browser tests |
| 05:00 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend run start -- --port 4317
node tools/video-record/record-clips.mjs docs/videos/86-claim-the-learning-bond --base http://localhost:4317
node tools/video-audio/generate-audio.mjs docs/videos/86-claim-the-learning-bond
node tools/video-build/build-video.mjs docs/videos/86-claim-the-learning-bond --no-captions
```

## Pitfalls

- No full SIN is typed on screen. The claim clip opens with both numbers already given, so only their last three digits show.
- Until a provider's channel is integrated, a deployment answers "Nothing was sent" (`UnconfiguredRespProviderChannel`, ADR 0080). The tests and the video use a fake provider.
- The agent's lines here are the approved fixed lines (`AgentFallbackCopy`). The model-backed answers are prompt 92.
- Following, pausing and resuming a claim is prompt 87. Withdrawing consent is prompt 88.

## References

- `docs/specs/L2.md`: L2-144 to L2-149, L2-159
- `docs/adr/0076-learning-bond-keeps-financial-data-encrypted-and-submits-only-on-the-guardians-request.md`, `docs/adr/0080-learning-bond-providers-and-province-are-code-and-the-address-is-asked-on-the-review.md`
- `docs/detailed-designs/learning-bond/open-guardian-learning-bond/README.md`, `give-and-withdraw-consent/README.md`, `complete-intake/README.md`, `estimate-learning-bond/README.md`, `review-and-submit-application/README.md`
