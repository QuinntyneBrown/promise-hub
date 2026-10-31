# 84 · Sign the data-handling agreement

> **Runtime:** ~5 min · **Audience:** admins, contributors and product owners · **Prerequisites:** [83 · Turn on Learning Bond](../83-turn-on-learning-bond/README.md)

**Video:** [84-sign-the-data-handling-agreement.mp4](84-sign-the-data-handling-agreement.mp4) · [Slides](slides.html) · **Audio:** [84-sign-the-data-handling-agreement.mp3](84-sign-the-data-handling-agreement.mp3) · [Transcript](script.md)

## Why this video exists

Slice 84 lets an organization whose admin cannot sign accept the Learning Bond data-handling agreement anyway: the person named in prompt 83 opens a single-use emailed link with no account, ticks the authority box and accepts, the admin who asked is told in the app and by email, and the link stops working (`L2-137`, ADR 0078).

## Learning objectives

By the end, the viewer can:

- Say how a signer reaches the agreement with no account, and why the page is served while Learning Bond is off.
- Say what accepting records, and what the admin sees afterwards.
- Name every way a link stops working, and what each says.
- Say why the admin's email preview shows "Read and accept" rather than the link.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Where does the page live? | `LearningBondSignerPage` in the settings library at `/sign/learning-bond/:token`, anonymous and outside the signed-in shell, so the `learning-bond` library never loads (ADR 0078) |
| How is the tenant chosen? | `LearningBondSignerLinkAccess` finds the link's hash among `LearningBondSignerToken` rows across organizations, then `TenantContext.ResolveForSigner` puts the request in that organization's scope with actor "Signer: {name}" |
| What does accepting record? | `LearningBondAgreementAcceptance.BySigner`: name, title, email, version, time, no membership; one audit entry; the request marked used; notice kind `agreement` and an email to the admin who asked |
| When does a link stop working? | Used, after 14 days, cancelled, replaced by Resend, or the organization suspended: 410 "This link has expired. Ask {organization} to send a new one."; unknown: 404 and the same words naming no one |
| Why "Read and accept" in the preview? | Only the link's hash is kept, so the admin can never see or resend the address; the words come from the same `LearningBondSignerEmailDto` that was sent |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/LearningBond/LearningBondSignerLinkAccess.cs`, `LearningBondSignerLinkHandler.cs`, `backend/src/PromiseHub.Api/Endpoints/LearningBondSignerEndpoints.cs` | Resolving the link, reading and accepting |
| `backend/src/PromiseHub.Domain/LearningBond/LearningBondAgreementAcceptance.cs`, `LearningBondSignerToken.cs` | The signer's acceptance and every issued link |
| `backend/src/PromiseHub.Application/LearningBond/LearningBondSignerEmailDto.cs`, `Notifications/NotificationKinds.cs` | The email's words and the `agreement` notice kind |
| `frontend/projects/settings/src/lib/learning-bond-signer-page/`, `learning-bond-signer-email-dialog/` | The signer's page and the email preview |
| `shots/desktop-waiting-signer.png`, `desktop-email-preview.png` | Grace names Angela and sees the email |
| `shots/desktop-signer.png`, `desktop-signer-invalid.png`, `desktop-signer-accepted.png`, `phone-signer.png`, `phone-signer-accepted.png` | Angela's page, the authority box, thank you; on a phone |
| `shots/desktop-notice.png`, `desktop-accepted-by-signer.png` | Grace is told |
| `shots/desktop-signer-expired.png`, `desktop-signer-unknown.png`, `desktop-signer-error.png` | Dead, unknown and failed links |
| `clips/email-desktop.mp4`, `signer-desktop.mp4`, `signer-phone.mp4`, `admin-desktop.mp4`, `states-desktop.mp4` | Screen recordings of the running app against a fake API |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00 | Introduction | The person who can sign |
| 00:23 | Named signer | Grace names Angela; Waiting for |
| 00:48 | The email | See the email; Read and accept |
| 01:15 | The link | No sign-in; the agreement in full |
| 01:38 | Authority | Refused without the box |
| 01:58 | Thank you | What was recorded; the link used |
| 02:20 | Phone | One column |
| 02:45 | Grace is told | The notice, the acceptance, Modules |
| 03:15 | Dead links | Expired, replaced, suspended, unknown, error |
| 03:47 | Testing | API and browser tests |
| 04:23 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend run start -- --port 4317
node tools/video-record/record-clips.mjs docs/videos/84-sign-the-data-handling-agreement --base http://localhost:4317
node tools/video-audio/generate-audio.mjs docs/videos/84-sign-the-data-handling-agreement
node tools/video-build/build-video.mjs docs/videos/84-sign-the-data-handling-agreement --no-captions
```

## Pitfalls

- The signer page never shows the signer's email before acceptance and never shows the token; the thank-you page shows what was recorded.
- The `agreement` notice kind needs Roster and Messages, not Learning Bond, so the admin sees it while the module is still off.
- The page has no empty state: an open link always has the current agreement.

## References

- `docs/specs/L2.md`: L2-137 (criteria 8 to 11), L2-136, L2-026, L2-161
- `docs/adr/0078-the-learning-bond-signer-page-is-anonymous-and-lives-in-the-settings-library.md`, `docs/adr/0077-the-learning-bond-agreement-is-served-before-the-module-is-on-from-the-settings-library.md`
- `docs/detailed-designs/learning-bond/accept-data-handling-agreement/README.md`

### Background music (mandatory)

Every video has background music, `assets/music/on-the-beach-intro-outro.mp3`, named in every deck with
`<body data-music="../assets/music/on-the-beach-intro-outro.mp3">`. The builder lays
it under the narration, looped, at −10.8 dB with a fade in, holds the last slide 3 s
so the music fades out, and fails a deck that names no music. Source and licence are
in `assets/music/README.md`.
