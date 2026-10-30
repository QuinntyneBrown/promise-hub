# 88 · Withdraw Learning Bond consent

> **Runtime:** ~3.7 min · **Audience:** guardians' advocates, privacy reviewers, contributors and product owners · **Prerequisites:** [86 · Claim the Learning Bond](../86-claim-the-learning-bond/README.md), [87 · Follow or resume a claim](../87-follow-or-resume-a-claim/README.md)

**Video:** [88-withdraw-learning-bond-consent.mp4](88-withdraw-learning-bond-consent.mp4) · [Slides](slides.html) · **Audio:** [88-withdraw-learning-bond-consent.mp3](88-withdraw-learning-bond-consent.mp3) · [Transcript](script.md)

## Why this video exists

Slice 88 lets a guardian withdraw Learning Bond consent for a child from Your consents. A dialog first names what stops and what stays with the provider. The withdrawal cancels anything unsent and destroys the child's SIN and answers, plus the guardian's own when no other child still has consent. It stops every reminder and text, and keeps only the status, provider and dates of anything already sent. Consenting again starts over. It proves the destruction path across every record prompts 86 and 87 created (`L2-152`, `L2-159`).

## Learning objectives

By the end, the viewer can:

- Find Your consents and say what the dialog promises.
- List what a withdrawal destroys, what it keeps, and when the guardian's own SIN goes.
- Say what happens to a provider's later news and to a new consent.

## Key questions

| Question | What a strong answer includes |
|---|---|
| What does the dialog say? | "We'll stop and delete {first name}'s information here. Anything already sent to {provider} stays with them; contact them to close the RESP.", with Stops and Stays; focus starts on Cancel |
| What is destroyed? | The child's SIN ciphertext; unsent applications are cancelled; reminders are cancelled; documents not yet sent are deleted from storage. The guardian's SIN and the tax answer go too when no other child of the household has consent. |
| What is kept? | For anything already sent, the status, provider and dates, with no SIN. A later provider event still moves the status but texts nobody. |
| What happens on a new consent? | A new claim, and the intake starts from the first question, because a destroyed SIN no longer counts as given. |
| Who can withdraw? | Only the household's own link on a verified device. Another household's link, or an unknown consent, gets 404; with the module off, 404. |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/LearningBond/LearningBondWithdrawHandler.cs` | The one unit of work |
| `backend/src/PromiseHub.Domain/LearningBond/LearningBondClaim.cs`, `LearningBondApplication.cs`, `LearningBondIntake.cs`, `LearningBondConsent.cs` | `Withdraw`, `Cancel`, `ClearAnswers` |
| `frontend/projects/learning-bond/src/lib/guardian/learning-bond-withdraw-dialog.*`, `guardian-learning-bond-page.*` | Your consents and the dialog |
| `shots/phone-your-consents.png`, `phone-withdraw-dialog.png`, `phone-withdrawn.png`, `phone-intake-again.png` | On a phone |
| `shots/desktop-your-consents.png`, `desktop-withdraw-dialog.png` | On a laptop |
| `clips/withdraw-phone.mp4`, `again-phone.mp4`, `dialog-desktop.mp4` | Screen recordings of the running app against a fake API |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00 | Introduction | Taking consent back |
| 00:13 | Your consents | One row per child, with Withdraw |
| 00:39 | Stops and stays | The dialog |
| 01:10 | Withdrawing | What is destroyed and kept |
| 01:59 | Starting again | A new consent, the first question |
| 02:15 | Laptop | The dialog, Cancel |
| 02:28 | Testing | API and browser tests |
| 03:13 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend run start -- --port 4317
node tools/video-record/record-clips.mjs docs/videos/88-withdraw-learning-bond-consent --base http://localhost:4317
node tools/video-audio/generate-audio.mjs docs/videos/88-withdraw-learning-bond-consent
node tools/video-build/build-video.mjs docs/videos/88-withdraw-learning-bond-consent --no-captions
```

## Pitfalls

- The RESP itself is the provider's: PromiseHub cannot close it, and the dialog says so.
- A destroyed SIN keeps its last three digits for the record of what was sent, but the intake treats it as not given.

## References

- `docs/specs/L2.md`: L2-152, L2-159, L2-058
- `docs/adr/0076-learning-bond-keeps-financial-data-encrypted-and-submits-only-on-the-guardians-request.md`
- `docs/detailed-designs/learning-bond/give-and-withdraw-consent/README.md`
