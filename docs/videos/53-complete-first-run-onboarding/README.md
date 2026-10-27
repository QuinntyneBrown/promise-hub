# 53 · Complete first-run onboarding

> **Runtime:** ~4 min · **Audience:** contributors, product owners and program staff who welcome new youth · **Prerequisites:** [51 · Accept an invitation as a youth or mentor](../51-accept-an-invitation/README.md), [52 · Give guardian consent for a youth](../52-give-guardian-consent/README.md)

**Video:** [53-complete-first-run-onboarding.mp4](53-complete-first-run-onboarding.mp4) · [Slides](slides.html) · **Audio:** [53-complete-first-run-onboarding.mp3](53-complete-first-run-onboarding.mp3) · [Transcript](script.md)

## Why this video exists

Slice 53 turns a new youth account into someone ready to learn: a three-step setup saved on the server step by step, a way to leave and resume, and a waiting state with a server-side lock for a youth not yet placed in a program (`L2-059`, `L2-060`, ADR 0047).

## Learning objectives

By the end, the viewer can:

- Say when setup opens and what each of its three steps saves.
- Explain how Finish later and resume work, and why Learning redirects only once.
- Describe the no-cohort lock: what places a youth and which endpoint it guards.
- Name the order of the gates: consent, then placement, with the module and roles around them.

## Key questions

| Question | What a strong answer includes |
|---|---|
| When does setup open? | On the first visit to Learning, when `GET /learning/onboarding` answers not-started |
| What is saved, and where? | One `YouthOnboarding` row per youth membership: step, preferred name, pronouns, three preferences, completion |
| What places a youth? | An active enrollment of the linked child in a program that is not archived, in the same organization |
| What does an unplaced youth get? | `GET /learning/lessons` → 403 `no-cohort`; Learning shows the waiting state with Check again |

## Code / assets on screen

| File | What to show |
|---|---|
| `frontend/projects/learning/src/lib/youth-welcome/youth-welcome-page.html` | The three steps |
| `frontend/projects/learning/src/lib/learning-page/learning-page.html` | The resume alert and the no-cohort state |
| `backend/src/PromiseHub.Application/Learning/OnboardingHandler.cs` | Defaults, saving, finishing |
| `backend/src/PromiseHub.Application/Learning/Placement.cs` | What places a youth |
| `backend/src/PromiseHub.Api/Authorization/PlacementFilter.cs` | The no-cohort lock |
| `docs/adr/0047-youth-onboarding-and-program-placement.md` | The decisions |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:22 | Introduction | What the video covers |
| 00:22-01:17 | First visit | Clip: Nadia goes through the three steps; you, preferences, program and success screenshots |
| 01:17-01:39 | Mistakes | Clip: invalid and a failed save; the validation table |
| 01:39-02:02 | Resume | Clip: Finish later and pick up; laptop screenshots |
| 02:02-02:39 | Waiting | Clip: waiting note, waiting state, then placed; empty screenshots |
| 02:39-03:05 | Consent | The order of the gates |
| 03:05-03:48 | Testing | What the tests prove |
| 03:48-04:15 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend run start -- --port 4317
node tools/video-record/record-clips.mjs docs/videos/53-complete-first-run-onboarding --base http://localhost:4317
PYTHON=python3 node tools/video-audio/generate-audio.mjs docs/videos/53-complete-first-run-onboarding
node tools/video-build/build-video.mjs docs/videos/53-complete-first-run-onboarding --no-captions
```

## Pitfalls

- Every later Learning endpoint that returns program content must add `RequirePlacement()` after `RequireGuardianConsent()`; hiding a page is not the lock.
- Finish later saves what is on screen at the current step; a blank name is refused there too, so the youth is never sent back to setup in a loop.
- The profile photo, the mentor on the program step and messaging a mentor from the waiting state are deferred (prompts 54 and 74).

## References

- `docs/specs/L2.md` (`L2-059`, `L2-060`)
- `docs/detailed-designs/learning/onboard-youth/README.md`, `learning/await-cohort-placement`
