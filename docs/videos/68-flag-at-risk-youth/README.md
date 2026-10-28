# 68 · Flag at-risk youth

> **Runtime:** ~5 min · **Audience:** mentors, program directors, developers · **Prerequisites:** [55 · Use the mentor dashboard](../55-use-the-mentor-dashboard/README.md), [67 · Record mentor check-ins](../67-record-mentor-check-ins/README.md)

**Video:** [68-flag-at-risk-youth.mp4](68-flag-at-risk-youth.mp4) · [Slides](slides.html) · **Audio:** [68-flag-at-risk-youth.mp3](68-flag-at-risk-youth.mp3) · [Transcript](script.md)

## Why this video exists

Safeguarding depends on catching youth who are slipping. Prompt 68 lets a mentor raise an at-risk flag with a severity and a reason, tells admins and program directors at once, and keeps the flag open until it is resolved with an outcome (`L2-091`, ADR 0062). An at-risk flag is not an incident; the video shows where the two meet.

## Learning objectives

By the end, the viewer can:

- Raise an at-risk flag on one of their youth and explain what the server requires.
- Say who is notified and who reads every flag.
- Resolve a flag with an outcome and find it under Resolved.
- Explain how a flag differs from an incident and when Report an incident appears.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Who raises a flag? | A mentor, on a youth in his scope; one open flag per youth |
| Who is told? | Every admin and program director, in app, without the reason |
| Who resolves? | A mentor of the youth, an admin or a program director, with an outcome and an optional note |
| What is audited? | Raising (with the severity) and resolving (with the outcome), never the reason or the note |
| Is a flag an incident? | No; while the Incident log is on, staff can report one from the flag |

## Code / assets on screen

| File | What to show |
|---|---|
| `frontend/projects/mentoring/src/lib/at-risk-flags-page/` | At-risk flags, Open and Resolved |
| `frontend/projects/mentoring/src/lib/raise-flag-dialog/`, `resolve-flag-dialog/` | The two dialogs |
| `backend/src/PromiseHub.Application/Mentoring/AtRiskFlagsHandler.cs` | Scope, checks, audit, notifications, resolving |
| `backend/src/PromiseHub.Domain/Mentoring/AtRiskFlag.cs` | The flag |
| `backend/tests/PromiseHub.Api.Tests/AtRiskFlagsTests.cs` | API acceptance tests |
| `e2e/tests/mentoring/at-risk-flags.spec.ts` | Browser acceptance tests |
| `shots/` | Default, raised, director, resolved, empty, error, invalid, already flagged, failed, Incident log off, Mentoring off; phone and desktop |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:26 | Introduction | A worry on record, not an incident |
| 00:26-01:08 | Raising | Daniel's flags, a flag on Mateo, the toast |
| 01:08-01:42 | Server checks | Required fields, one open flag, audit |
| 01:42-02:27 | Directors told | Marisol's notification, every flag, resolving Jordan |
| 02:27-02:43 | Resolving | Outcomes and the Resolved tab |
| 02:43-03:04 | Not an incident | Report an incident while the Incident log is on |
| 03:04-03:33 | Who sees | Scope, roles, tenancy, Mentoring off |
| 03:33-03:41 | Phone | One column, bottom sheet |
| 03:41-04:08 | States | Invalid, already flagged, failed, empty, error |
| 04:08-04:34 | Testing | API and browser tests |
| 04:34-04:57 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend start
node tools/video-record/record-clips.mjs docs/videos/68-flag-at-risk-youth --base http://localhost:4200
node tools/video-audio/generate-audio.mjs docs/videos/68-flag-at-risk-youth
node tools/video-build/build-video.mjs docs/videos/68-flag-at-risk-youth --no-captions
```

## Pitfalls

- Treating a flag as an incident: someone hurt or in danger is reported to the program director now.
- Raising a second flag on a youth with an open one; resolve the first.
- Expecting automatic flags from inactivity or missed sessions; they are deferred (ADR 0062).

## References

- [`L2-091`](../../specs/L2.md) · [ADR 0062](../../adr/0062-an-at-risk-flag-is-raised-by-a-mentor-read-by-directors-and-resolved-with-an-outcome.md) · [Design](../../detailed-designs/mentoring/manage-at-risk-flags/README.md)
