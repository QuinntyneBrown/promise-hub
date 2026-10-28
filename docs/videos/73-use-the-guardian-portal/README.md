# 73 · Use the guardian portal

> **Runtime:** ~6 min · **Audience:** guardians, program directors, office staff, developers · **Prerequisites:** [28 · Update household details](../28-update-household-details/README.md), [52 · Give guardian consent](../52-give-guardian-consent/README.md), [65 · View journey and progress](../65-view-journey-and-progress/README.md)

**Video:** [73-use-the-guardian-portal.mp4](73-use-the-guardian-portal.mp4) · [Slides](slides.html) · **Audio:** [73-use-the-guardian-portal.mp3](73-use-the-guardian-portal.mp3) · [Transcript](script.md)

## Why this video exists

Families want to know how their children are doing without an account. Prompt 73 brings Waypoint's guardian portal into PromiseHub as the household link's pages (`L2-102` to `L2-104`, ADR 0067): each child's schedule, consents, attendance and read-only Learning progress, and the announcements Messages sent the family, in the household's language.

## Learning objectives

By the end, the viewer can:

- Open a child's page from the family page and say what it shows and never shows.
- Say where the Learning numbers come from and when the section is absent.
- Read announcements and mark them read, and say what is not an announcement.
- Name the Spanish, empty, failed, expired, not available and Messages off states.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Does a guardian need an account? | No: the household link, verified once per device with a six-digit code (L2-026) |
| Which child can a link open? | Only the link's household's children; another's answers 404 |
| What does Learning show? | Lessons done of total, each module, badges earned, from the youth's own reads; never content, answers, reflections or notes |
| What is an announcement? | A Messages-module message with a sent delivery to the household; read flags on `Delivery.ReadAt` |
| What happens with Messages off? | No Announcements card, the page is not available and the API answers 404 |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Guardian/GuardianChildHandler.cs` | Schedule, consents, attendance and Learning for one child of the link's household |
| `backend/src/PromiseHub.Application/Guardian/GuardianAnnouncementsHandler.cs` | Announcements, Mark all read, the family page's count |
| `frontend/projects/guardian/src/lib/guardian-child-page/` | The child page |
| `frontend/projects/guardian/src/lib/guardian-announcements-page/` | The announcements page |
| `shots/desktop-home.png`, `desktop-child.png`, `desktop-learning.png`, `desktop-announcements.png`, `desktop-all-read.png` | Default and success states on a laptop |
| `shots/phone-home.png`, `phone-learning.png`, `phone-announcements.png` | The same on a phone |
| `shots/desktop-spanish.png`, `desktop-announcements-empty.png`, `desktop-expired.png`, `desktop-mark-failed.png`, `desktop-messages-off.png` | Language, empty, expired, error and module-off states |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00–00:34 | Introduction | No account: the household link |
| 00:34–01:11 | Family page | Your children and Announcements (clip) |
| 01:11–01:43 | Child page | Schedule and consents, read only |
| 01:43–02:28 | Progress | Attendance and Learning; what is never sent |
| 02:28–03:00 | Announcements | New, Mark all read (clip) |
| 03:00–03:23 | Contact | Update your details |
| 03:23–03:59 | Phone | One column (clip) |
| 03:59–04:41 | States | Spanish, Mateo, failed, empty, Messages off, expired (clip) |
| 04:41–05:20 | Testing | API and browser tests |
| 05:20–05:46 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend run start -- --port 4317
node tools/video-record/record-clips.mjs docs/videos/73-use-the-guardian-portal --base http://localhost:4317
PYTHON=python3 node tools/video-audio/generate-audio.mjs docs/videos/73-use-the-guardian-portal
node tools/video-build/build-video.mjs docs/videos/73-use-the-guardian-portal --no-captions
```

## Pitfalls

- The child id in the address never widens access: the household comes from the link.
- Turning Learning, Roll Call, Slips or Messages off removes that section or page; nothing is deleted.
- Consents are read only here; they are given and withdrawn from their own links.

## References

- [L2-102 to L2-104](../../specs/L2.md) · [ADR 0067](../../adr/0067-the-guardian-portal-is-the-household-link-with-read-only-child-pages-and-messages-as-announcements.md)
- [view-child-progress](../../detailed-designs/guardian/view-child-progress/README.md) · [read-announcements](../../detailed-designs/guardian/read-announcements/README.md) · [manage-contact-details](../../detailed-designs/guardian/manage-contact-details/README.md)
