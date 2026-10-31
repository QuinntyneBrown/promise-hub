# 83 · Turn on Learning Bond

> **Runtime:** ~6.5 min · **Audience:** admins, contributors and product owners · **Prerequisites:** [82 · Learning Bond safeguards](../82-learning-bond-safeguards-foundation/README.md)

**Video:** [83-turn-on-learning-bond.mp4](83-turn-on-learning-bond.mp4) · [Slides](slides.html) · **Audio:** [83-turn-on-learning-bond.mp3](83-turn-on-learning-bond.mp3) · [Transcript](script.md)

## Why this video exists

Slice 83 is the first visible staff journey of Learning Bond: an admin reads and accepts the versioned data-handling agreement, or names a signer, chooses which programs it covers and which staff roles see status, and reviews the invitation, editing only the sender name. A new agreement version keeps the module on but disables Launch until it is accepted (`L2-135` to `L2-139`, ADR 0076, ADR 0077).

## Learning objectives

By the end, the viewer can:

- Accept the agreement for an organization, or name the person who can, and say why the agreement is served while the module is off.
- Choose coverage and status roles, and say which roles are fixed and which are never offered.
- Say what an organization can change in the invitation, and what it cannot.
- Say what a new agreement version does to families in progress and to Launch.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Why is the agreement in Settings? | It must be accepted before Learning Bond can be on, and the `learning-bond` library only loads while the module is on (ADR 0077); the API's agreement routes need `ManageSettings` with Roster and Messages on |
| What does accepting record? | Organization, version, who (name and membership) and when, audited as Created; refused with 422 without the authority box |
| How does a named signer work? | Name, title and email; a single-use 14-day link stored as a hash, emailed from "{organization} via PromiseHub"; one open request; Resend mints a new link; Cancel closes it |
| Which households does coverage reach? | Children under 18 actively enrolled in a covered running program, counted on the server by `LearningBondCoverage`; archived and foreign programs refused |
| What can change in the invitation? | Only the sender name: 1 to 30 letters, numbers, spaces and `&'.-`, never a link or phone number; the wording is `LearningBondTexts` in English, Spanish and French |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/LearningBond/LearningBondAgreementHandler.cs`, `LearningBondSignerHandler.cs`, `backend/src/PromiseHub.Domain/LearningBond/LearningBondSignerRequest.cs` | Accepting and the named signer |
| `backend/src/PromiseHub.Application/LearningBond/LearningBondSettingsHandler.cs`, `LearningBondCoverage.cs`, `backend/src/PromiseHub.Domain/LearningBond/LearningBondSettings.cs` | Coverage and status roles |
| `backend/src/PromiseHub.Application/LearningBond/LearningBondInvitationHandler.cs`, `LearningBondTexts.cs`, `SenderNameRule.cs`, `LearningBondOverviewHandler.cs` | The invitation and the hub |
| `frontend/projects/settings/src/lib/learning-bond-agreement/`, `learning-bond-signer-dialog/` | The agreement page and the signer dialog |
| `frontend/projects/learning-bond/src/lib/hub/`, `coverage/`, `invitation/`, `frontend/projects/components/src/lib/email-preview/` | The hub, coverage, invitation and `ph-email-preview` |
| `shots/desktop-modules-refused.png`, `desktop-agreement.png`, `desktop-agreement-invalid.png`, `desktop-accepted-off.png` | Refused, the agreement, invalid, accepted while off |
| `shots/desktop-signer-dialog.png`, `desktop-waiting-signer.png` | The named signer |
| `shots/desktop-hub.png`, `desktop-coverage.png`, `desktop-coverage-saved.png`, `desktop-invitation.png`, `desktop-invitation-saved.png`, `desktop-new-version.png` | The hub, coverage, invitation and the new version |
| `shots/phone-hub.png`, `phone-invitation.png`, `desktop-coverage-invalid.png`, `desktop-invitation-invalid.png`, `desktop-error.png`, `desktop-forbidden.png` | Phone, invalid, error and forbidden |
| `clips/accept-desktop.mp4`, `signer-desktop.mp4`, `coverage-desktop.mp4`, `invitation-desktop.mp4`, `new-version-desktop.mp4`, `hub-phone.mp4`, `states-desktop.mp4` | Screen recordings of the running app against a fake API |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00 | Introduction | Two admins, one journey |
| 00:25 | Refused | Modules refuses; Read the agreement |
| 01:05 | The agreement | Three sections; invalid; accepted while off; turned on |
| 01:45 | Named signer | Dialog, waiting, Resend |
| 02:20 | The hub | Four cards; the Settings tab |
| 02:44 | Coverage | Programs with households; fixed roles |
| 03:24 | Invitation | Three languages; the sender name rule |
| 03:58 | New version | Launch disabled until accepted |
| 04:34 | Phone and states | Phone, invalid, error, forbidden |
| 05:23 | Testing | API and browser tests |
| 05:56 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend run start -- --port 4317
node tools/video-record/record-clips.mjs docs/videos/83-turn-on-learning-bond --base http://localhost:4317
node tools/video-audio/generate-audio.mjs docs/videos/83-turn-on-learning-bond
node tools/video-build/build-video.mjs docs/videos/83-turn-on-learning-bond --no-captions
```

## Pitfalls

- There is no empty state on these screens: the agreement always has a current version, coverage always lists the roles and the invitation always has the platform wording (the mocks mark them not applicable).
- The previews show a sample child (Maya), guardian (Alex) and link, never a family's name, because nothing about a family is read before invitations go out.
- The signer's own page behind the emailed link is prompt 84; launching is prompt 85.

## References

- `docs/specs/L2.md`: L2-135, L2-136, L2-137, L2-138, L2-139, L2-161, L2-162
- `docs/adr/0076-learning-bond-keeps-financial-data-encrypted-and-submits-only-on-the-guardians-request.md`, `docs/adr/0077-the-learning-bond-agreement-is-served-before-the-module-is-on-from-the-settings-library.md`
- `docs/detailed-designs/learning-bond/accept-data-handling-agreement/README.md`, `configure-coverage-and-invitation/README.md`, `gate-learning-bond-module/README.md`
