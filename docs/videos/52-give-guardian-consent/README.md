# 52 · Give guardian consent for a youth

> **Runtime:** ~4 min · **Audience:** contributors, product owners and program staff who work with youth under the consent age · **Prerequisites:** [12 · Sign a permission slip](../12-sign-a-permission-slip/README.md), [51 · Accept an invitation as a youth or mentor](../51-accept-an-invitation/README.md)

**Video:** [52-give-guardian-consent.mp4](52-give-guardian-consent.mp4) · [Slides](slides.html) · **Audio:** [52-give-guardian-consent.mp3](52-give-guardian-consent.mp3) · [Transcript](script.md)

## Why this video exists

Slice 52 holds a youth under the organization's consent age at a server-side gate until a guardian consents from a verified link, lets staff see the status and send the link, lets the guardian withdraw, and lets admins set the age and the wording (`L2-055` to `L2-058`, ADR 0046).

## Learning objectives

By the end, the viewer can:

- Explain where the consent gate runs and what it protects.
- Follow a guardian from the texted link to a recorded consent, in the household's language.
- Say what a consent record keeps and what a withdrawal changes.
- Name who reads and who sends a consent link, and where the policy is set.

## Key questions

| Question | What a strong answer includes |
|---|---|
| When does a youth need consent? | A youth account, and under the consent age (default 18) or no date of birth; evaluated on every request |
| What does the gate answer? | 403 `consent-required` on youth work (`GET /learning/lessons`); `/learning/me` and the request stay open |
| How does a guardian sign? | Verified device, relationship, ticked box, typed name matching a guardian who may sign |
| What does a withdrawal do? | Gates the youth from the next request; keeps the record; the same link can consent again |

## Code / assets on screen

| File | What to show |
|---|---|
| `frontend/projects/learning/src/lib/learning-page/learning-page.html` | The consent-required state |
| `frontend/projects/guardian/src/lib/guardian-consent-page/guardian-consent-page.html` | The guardian consent page |
| `frontend/projects/guardian/src/lib/withdraw-consent-dialog/withdraw-consent-dialog.ts` | The withdraw dialog |
| `frontend/projects/households/src/lib/child/child-page.html` | The Guardian consent card |
| `frontend/projects/settings/src/lib/consent-policy-dialog/consent-policy-dialog.ts` | The consent policy dialog |
| `backend/src/PromiseHub.Api/Authorization/GuardianConsentFilter.cs` | The gate |
| `backend/src/PromiseHub.Application/Guardian/GuardianConsentHandler.cs` | Signing and withdrawing |
| `docs/adr/0046-guardian-consent-for-youth.md` | The decisions |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:22 | Introduction | What the video covers |
| 00:22-01:01 | The gate | Clip: Sofía at the gate and asking; default and success screenshots |
| 01:01-01:51 | Consent | Clip: Carmen verifies and signs in Spanish; verify, error and success screenshots; the record; Learning opens |
| 01:51-02:18 | Staff | Clip: Tom sends the link; who reads and sends |
| 02:18-02:40 | Withdraw | Clip: withdraw in a dialog; confirm and withdrawn screenshots |
| 02:40-03:00 | Policy | Clip: Marisol sets 16 |
| 03:00-03:47 | Testing | What the tests prove; laptop screenshots |
| 03:47-04:09 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend run start -- --port 4317
node tools/video-record/record-clips.mjs docs/videos/52-give-guardian-consent --base http://localhost:4317
PYTHON=python3 node tools/video-audio/generate-audio.mjs docs/videos/52-give-guardian-consent
node tools/video-build/build-video.mjs docs/videos/52-give-guardian-consent --no-captions
```

## Pitfalls

- Every later Learning endpoint that returns youth work must add `RequireGuardianConsent()`; hiding a page is not the gate.
- A consent link lives 30 days and the next link for the child replaces it; ask again rather than resending an old text.
- Media and photo consent, re-consent each term and emailing another copy on request are deferred (prompts 73, 54, 79).

## References

- `docs/specs/L2.md` (`L2-055` to `L2-058`)
- `docs/detailed-designs/guardian/manage-guardian-consent/README.md`, `guardian/unlock-minor-participation`, `guardian/enforce-minor-safeguards`, `guardian/view-consent-record`, `guardian/manage-consent-settings`, `learning/obtain-required-consent`, `organizations/configure-consent-policy`
