# 82 · Learning Bond safeguards

> **Runtime:** ~4.5 min · **Audience:** contributors, product owners and admins · **Prerequisites:** [03 · Configure modules](../03-configure-modules/README.md), [81 · Explore the public website](../81-explore-the-public-website/README.md)

**Video:** [82-learning-bond-safeguards-foundation.mp4](82-learning-bond-safeguards-foundation.mp4) · [Slides](slides.html) · **Audio:** [82-learning-bond-safeguards-foundation.mp3](82-learning-bond-safeguards-foundation.mp3) · [Transcript](script.md)

## Why this video exists

Slice 82 lands the foundations of the twelfth module, Learning Bond, before any Learning Bond screen: the module gate (Roster, Messages and an accepted data-handling agreement before it turns on; 404 everywhere while it is off), the field-level encryption of social insurance numbers with destruction that keeps only the last three digits, and the audit entries (`L2-135`, `L2-159`, `L2-161`, `L2-162`, ADR 0076).

## Learning objectives

By the end, the viewer can:

- Say what Learning Bond needs before it turns on, and where the server checks it.
- Say what a staff member and a guardian see while the module is off, and why the library is never downloaded.
- Describe how a SIN is stored, masked, refused and destroyed.
- Find Learning Bond entries in the audit log, per organization.

## Key questions

| Question | What a strong answer includes |
|---|---|
| When can Learning Bond turn on? | `ModuleCatalog.Needs` is Roster and Messages; `SaveModulesHandler` asks `LearningBondAgreementGate` for an acceptance of the current version; 422 otherwise; once on, a new version does not switch it off |
| What does off mean? | `RequireModule(ModuleId.LearningBond)` answers 404; `moduleRoute` redirects to Today; the guardian door answers a bare 404 for off, suspended and unknown alike, audited as AccessDenied |
| How is a SIN stored? | `EncryptedSin` is ciphertext and last three; AES-256-GCM under `LearningBond:Key` outside the database; fresh nonce; altered or foreign ciphertext refused; no key, unavailable |
| How is it destroyed? | `LearningBondSinDestroyer` drops the ciphertext, keeps the last three and audits it as System without the value |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Domain/Organizations/ModuleCatalog.cs`, `backend/src/PromiseHub.Application/Organizations/SaveModulesHandler.cs`, `backend/src/PromiseHub.Application/LearningBond/LearningBondAgreementGate.cs` | Needs and the agreement gate |
| `backend/src/PromiseHub.Api/Endpoints/LearningBondEndpoints.cs`, `LearningBondGuardianEndpoints.cs`, `backend/src/PromiseHub.Application/LearningBond/LearningBondGuardianHandler.cs` | The staff and guardian doors |
| `backend/src/PromiseHub.Domain/LearningBond/EncryptedSin.cs`, `SocialInsuranceNumber.cs`, `backend/src/PromiseHub.Infrastructure/LearningBond/LearningBondCipher.cs`, `backend/src/PromiseHub.Application/LearningBond/LearningBondSinDestroyer.cs` | The encrypted store and destruction |
| `frontend/projects/learning-bond/`, `frontend/projects/promisehub/src/app/modules/learning-bond-link.guard.ts`, `errors/learning-bond-unavailable/` | The library, the link guard, the unavailable page |
| `shots/desktop-northgate-off.png`, `desktop-needs-messages.png`, `desktop-agreement.png`, `desktop-harbourview.png`, `desktop-saved.png` | Settings › Modules: off, refused twice, on |
| `shots/desktop-redirect.png`, `phone-unavailable.png`, `phone-modules.png`, `desktop-error.png`, `desktop-forbidden.png` | Redirect, guardian unavailable, phone, error, forbidden |
| `clips/refused-desktop.mp4`, `turn-on-desktop.mp4`, `redirect-desktop.mp4`, `guardian-phone.mp4`, `modules-phone.mp4`, `states-desktop.mp4` | Screen recordings of the running app against a fake API |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:27 | Introduction | Three foundations before the first screen |
| 00:27-00:52 | Twelfth module | Needs Roster and Messages |
| 00:52-01:23 | Refused twice | Messages, then the agreement |
| 01:23-01:41 | Turning it on | Harbourview's accepted agreement |
| 01:41-02:00 | Unreachable | 404, redirect to Today, library never loaded |
| 02:00-02:28 | Guardian link | Organization from the link; the same bare 404 |
| 02:28-03:08 | Encrypted | Ciphertext and last three, AES-GCM, refusals, the mask |
| 03:08-03:27 | Destroyed and audited | Last three kept; System; searchable per organization |
| 03:27-03:38 | Phone and states | Phone, error, forbidden |
| 03:38-04:10 | Testing | API, cipher, storage and browser tests |
| 04:10-04:38 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend run start -- --port 4200
node tools/video-record/record-clips.mjs docs/videos/82-learning-bond-safeguards-foundation --base http://localhost:4200
PYTHON=python3 PIPER_MODEL=/path/to/en-us-lessac-medium.onnx node tools/video-audio/generate-audio.mjs docs/videos/82-learning-bond-safeguards-foundation --engine piper
node tools/video-build/build-video.mjs docs/videos/82-learning-bond-safeguards-foundation --no-captions
```

The narration was synthesized with the offline Piper engine and the `en-us-lessac-medium` voice from Piper's own release, because the edge-tts service was not reachable from the session that built it. Re-running with the default edge engine gives the usual voice.

## Pitfalls

- The number 82 is shared with [The Waypoint merge, start to finish](../82-waypoint-merge-recap/README.md); the folder name follows prompt 82.
- No SIN appears on screen: the only digits shown are the mask's last three of the Government of Canada's published test number.
- Reading and accepting the agreement, and the Read the agreement link beside the switch, arrive with prompt 83.
- Webhooks, the daily destruction job and the seeded claims arrive with the claim (prompts 86 and 88).

## References

- `docs/specs/L2.md`: L2-135, L2-159, L2-161, L2-162, L2-004, L2-005
- `docs/adr/0076-learning-bond-keeps-financial-data-encrypted-and-submits-only-on-the-guardians-request.md`
- `docs/detailed-designs/learning-bond/gate-learning-bond-module/README.md`
