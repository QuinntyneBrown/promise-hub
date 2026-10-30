# 85 · Launch Learning Bond invitations

> **Runtime:** ~5.5 min · **Audience:** admins, site leads, contributors and product owners · **Prerequisites:** [83 · Turn on Learning Bond](../83-turn-on-learning-bond/README.md), [84 · Sign the data-handling agreement](../84-sign-the-data-handling-agreement/README.md)

**Video:** [85-launch-learning-bond-invitations.mp4](85-launch-learning-bond-invitations.mp4) · [Slides](slides.html) · **Audio:** [85-launch-learning-bond-invitations.mp3](85-launch-learning-bond-invitations.mp3) · [Transcript](script.md)

## Why this video exists

Slice 85 gets Learning Bond to families: the admin schedules one invitation per covered household for a day at 10:00 in the organization's time zone, or lets staff invite one household at a time at the door, and staff in the status roles see each covered household's status and take call requests, never a family's financial details (`L2-140`, `L2-142`, ADR 0079).

## Learning objectives

By the end, the viewer can:

- Read the launch page's counts and find the households to collect a contact from.
- Schedule, move and cancel a launch, and say what the send job does on the day.
- Invite a household at the door and say when it is not invited again.
- Say what staff see about a family, how a call request reaches them and what each outcome does.

## Key questions

| Question | What a strong answer includes |
|---|---|
| How is a launch scheduled? | `LaunchMode` and `LaunchDate` on `LearningBondSettings`; a day from tomorrow to 90 days ahead in the organization's time zone; refused with no mobile number (`no-phone-numbers`) or a pending agreement version; audited |
| What sends it? | `MessageDispatchRunner` asks `LearningBondLaunchHandler` each pass; at 10:00 local on the day it queues through `LearningBondInvitationSender` and `MessageWriter` as `MessageSource.LearningBond` (ADR 0079) |
| What does a family receive? | One text per guardian with a mobile number (email fallback) or an email, in the household's language, naming each eligible child, with its own `/g/learning-bond/{token}` link; never twice in 7 days |
| Who sees status? | Roles in the status roles: `GET /learning-bond/households`, the household card and the menu item (`learningBondStatus` on the session); others get 403 and no item |
| What happens to a call request? | `POST /g/learning-bond/{token}/callback` stores the number and time, the household reads Call requested, the status roles are notified; Mark call done records Resumed, Not interested or No answer (which keeps it open) |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/LearningBond/LearningBondLaunchHandler.cs`, `LearningBondInvitationSender.cs`, `LearningBondCoverage.cs` | Counts, scheduling and sending |
| `backend/src/PromiseHub.Infrastructure/Messaging/MessageDispatchRunner.cs`, `backend/src/PromiseHub.Application/Messaging/SendQueuedDeliveriesHandler.cs` | The due launch and the Learning Bond source |
| `backend/src/PromiseHub.Application/LearningBond/LearningBondHouseholdHandler.cs`, `LearningBondFamiliesHandler.cs`, `LearningBondGuardianHandler.cs`, `LearningBondStatusRoles.cs` | At the door, status and call requests |
| `frontend/projects/learning-bond/src/lib/launch/`, `families/`, `frontend/projects/households/src/lib/learning-bond-card/`, `learning-bond-invite-dialog/` | The pages, the card and the dialogs |
| `shots/desktop-hub.png`, `desktop-launch.png`, `desktop-missing-contacts.png`, `desktop-launch-invalid.png`, `desktop-launch-scheduled.png`, `desktop-cancel-launch.png` | Plan the launch |
| `shots/desktop-launch-at-door.png`, `desktop-household-card.png`, `desktop-invite-dialog.png`, `desktop-household-invited.png` | At the door |
| `shots/desktop-families.png`, `desktop-call-outcome.png`, `desktop-families-done.png` | Status and a call request |
| `shots/phone-families.png`, `phone-launch.png`, `desktop-launch-blocked.png`, `desktop-families-forbidden.png` | Phone, the no-mobile block and a role outside the status roles |
| `clips/launch-desktop.mp4`, `door-desktop.mp4`, `families-desktop.mp4`, `families-phone.mp4`, `states-desktop.mp4` | Screen recordings of the running app against a fake API |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00 | Introduction | From settings to families |
| 00:17 | Plan | Counts and the households to collect from |
| 00:56 | A day | The range; scheduled for Mon 9 Nov |
| 01:22 | Cancel | Cancel the launch? |
| 01:34 | Sending | The due launch at 10:00, through Messages |
| 02:11 | At the door | The household card and its invitation |
| 02:43 | Households | Status and filters |
| 03:09 | Call request | Mark call done |
| 03:35 | Phone and states | Phone, no mobile, forbidden |
| 04:09 | Testing | API and browser tests |
| 04:49 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend run start -- --port 4317
node tools/video-record/record-clips.mjs docs/videos/85-launch-learning-bond-invitations --base http://localhost:4317
node tools/video-audio/generate-audio.mjs docs/videos/85-launch-learning-bond-invitations
node tools/video-build/build-video.mjs docs/videos/85-launch-learning-bond-invitations --no-captions
```

## Pitfalls

- STOP replies are not yet honoured inside PromiseHub: there is no inbound SMS (ADR 0079). The text carries "STOP to opt out" for the provider.
- The guardian's own "I'd rather talk to someone" dialog arrives with the guardian pages (prompt 86); its API is in place.
- The claim's steps (Started, Paused, Submitted, Deposited) appear in the households list once the claim is built.

## References

- `docs/specs/L2.md`: L2-140, L2-142, L2-139
- `docs/adr/0079-learning-bond-launches-are-due-rows-the-dispatch-runner-sends.md`, `docs/adr/0076-learning-bond-keeps-financial-data-encrypted-and-submits-only-on-the-guardians-request.md`
- `docs/detailed-designs/learning-bond/launch-invitations/README.md`, `support-families-with-status/README.md`

### Background music (mandatory)

Every video has background music, `assets/music/on-the-beach-intro-outro.mp3`, named in every deck with
`<body data-music="../assets/music/on-the-beach-intro-outro.mp3">`. The builder lays
it under the narration, looped, at −10.8 dB with a fade in, holds the last slide 3 s
so the music fades out, and fails a deck that names no music. Source and licence are
in `assets/music/README.md`.
