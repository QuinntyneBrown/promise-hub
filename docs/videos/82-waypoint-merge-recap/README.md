# 82 · The Waypoint merge, start to finish

> **Runtime:** ~9 min · **Audience:** contributors, product owners and program staff · **Prerequisites:** [49 · Merge Waypoint: foundation](../49-merge-waypoint-foundation/README.md)

**Video:** [82-waypoint-merge-recap.mp4](82-waypoint-merge-recap.mp4) · [Slides](slides.html) · **Audio:** [82-waypoint-merge-recap.mp3](82-waypoint-merge-recap.mp3) · [Transcript](script.md)

## Why this video exists

Prompts 49 to 81 moved Waypoint into PromiseHub one journey at a time, each with its own video (49 to 81). This closing video tells the story of the whole merge in one place: what Waypoint brought, how ADR 0043 mapped it onto PromiseHub, the Learning, Mentoring and Public website modules and the Youth, Mentor and Volunteer roles, the journeys in seven groups, and what was deferred.

## Learning objectives

By the end, the viewer can:

- Say what Waypoint brought and where each part landed in PromiseHub (ADR 0043).
- Name the three new modules and three participant roles, and what each role may see.
- Place each journey video (50 to 81) in its group.
- Name what was deferred and where it is recorded.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Where did Waypoint land? | Cohort a program with a term, session an event with RSVP, attendance Roll Call, applications the enrollment link, announcements and messages Messages, guardians verified-link pages, no guardian accounts |
| What is new? | `Learning`, `Mentoring`, `PublicWebsite` modules, each needing Roster, off until turned on; `Youth`, `Mentor`, `Volunteer` roles without `UseStaffApp` |
| How did the code change as it moved? | Plain handlers and minimal API endpoints, one Angular app with a library per feature, xUnit against the fake database, Playwright against the fake API, cookie sessions |
| What waited? | The website's staff inbox and payment provider, lesson authoring details and video transcoding, automatic flags, reminders, series edits, email and push per kind, record editing, admin resets, report ranges and PDFs |

## Code / assets on screen

| File | What to show |
|---|---|
| `docs/adr/0043-merge-waypoint.md` | The subsystem, role and convention mapping |
| `docs/adr/0044-*.md` to `docs/adr/0075-*.md` | One decision record per journey; the deferred items |
| `docs/estimates/README.md` | Learning, curriculum, mentoring and website effort and percent complete |
| `../51-accept-an-invitation/shots/phone-accept-youth.png`, `../52-give-guardian-consent/shots/phone-consent-es.png`, `../53-complete-first-run-onboarding/shots/phone-welcome-you.png` | Sign-in, invitations and consent |
| `../54-manage-cohorts/shots/desktop-mentors.png`, `../58-apply-or-refer/shots/desktop-who.png`, `../59-review-and-place-applicants/shots/desktop-applications.png` | Cohorts and applicants |
| `../56-author-curriculum/shots/desktop-tracks.png`, `../60-author-quizzes-and-assignments/shots/desktop-quiz-questions.png`, `../61-take-quizzes/shots/desktop-result-passed.png`, `../63-grade-and-assess/shots/desktop-grade-scored.png` | Authoring, quizzes and grading |
| `../67-record-mentor-check-ins/shots/desktop-history.png`, `../69-assign-work/shots/desktop-assigned.png` | Check-ins and assigned work |
| `../72-use-the-volunteer-portal/shots/desktop-today.png`, `../73-use-the-guardian-portal/shots/desktop-child.png` | Volunteer and guardian pages |
| `../74-announce-and-message/shots/desktop-conversation.png`, `../75-receive-notifications/shots/desktop-center.png` | Messages and notifications |
| `../76-manage-people/shots/desktop-people.png`, `../79-configure-the-organization/shots/desktop-organization.png`, `../80-report-export-and-import/shots/desktop-board.png` | People, settings and reports |
| `clips/mentor-dashboard-desktop.mp4`, `learning-desktop.mp4`, `journey-desktop.mp4`, `at-risk-desktop.mp4`, `rsvp-desktop.mp4`, `reset-phone.mp4`, `site-landing-desktop.mp4`, `site-programs-desktop.mp4` | Screen recordings of the running app against a fake API, replayed from videos 55, 69, 65, 68, 70, 77 and 81 by `clips/clips.mjs` |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:56 | Introduction, Waypoint | 33 prompts and decision records; what Waypoint brought |
| 00:56-01:46 | Mapping | ADR 0043: where each part landed; PromiseHub's conventions |
| 01:46-02:26 | Modules and roles | Learning, Mentoring, Public website; Youth, Mentor, Volunteer |
| 02:26-03:01 | Sign-in and consent | Videos 50 to 53 |
| 03:01-03:41 | Cohorts and mentors | Terms and mentors, the mentor dashboard (clip), applicants |
| 03:41-04:30 | Learning | Authoring, Sofía's Learning (clip), scoring and grading, journey and progress (clip) |
| 04:30-05:03 | Mentoring tools | At-risk flags (clip), check-ins, assigned work |
| 05:03-05:39 | Sessions | RSVP (clip), volunteer and guardian pages |
| 05:39-06:06 | Messages | Announcements, conversations, notifications |
| 06:06-06:59 | People and settings | People, a password reset (clip), settings and reports |
| 06:59-07:33 | Public website | The home page and programs (clips) |
| 07:33-08:15 | Deferred | What waited, by area and decision record |
| 08:15-08:54 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend run start -- --port 4317
node tools/video-record/record-clips.mjs docs/videos/82-waypoint-merge-recap --base http://localhost:4317
PYTHON=python3 node tools/video-audio/generate-audio.mjs docs/videos/82-waypoint-merge-recap
node tools/video-build/build-video.mjs docs/videos/82-waypoint-merge-recap --no-captions
```

## Pitfalls

- `clips/clips.mjs` replays clips from the earlier videos with their own fake APIs and skips their screenshots, so nothing outside this folder is written. Clips whose fakes predate later contracts were not reused: Sofía's sign-in (50) is replaced by her password reset (77), the Learning home (57) by video 69's, and the journey (65) by 65's progress clip.
- Video 55's fake dashboard predates the follow-ups (67) and Check-ins due (79); `clips.mjs` adds those fields as the real API answers them.
- The three modules are off for every organization until an admin turns them on; the whole suite preset does not include them.

## References

- `docs/adr/0043-merge-waypoint.md` and ADR 0044 to 0075
- `docs/specs/L1.md`, `docs/specs/L2.md`
- `docs/estimates/README.md`, `learning.md`, `curriculum.md`, `mentoring.md`, `website.md`
- Videos [49](../49-merge-waypoint-foundation/README.md) to [81](../81-explore-the-public-website/README.md)
