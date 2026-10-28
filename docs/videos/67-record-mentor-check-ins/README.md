# 67 · Record mentor check-ins

> **Runtime:** ~5 min · **Audience:** mentors, program directors, developers · **Prerequisites:** [55 · Use the mentor dashboard](../55-use-the-mentor-dashboard/README.md)

**Video:** [67-record-mentor-check-ins.mp4](67-record-mentor-check-ins.mp4) · [Slides](slides.html) · **Audio:** [67-record-mentor-check-ins.mp3](67-record-mentor-check-ins.mp3) · [Transcript](script.md)

## Why this video exists

Mentors keep in touch through conversations. Prompt 67 lets a mentor log each one as a mentor check-in (`L2-090`, ADR 0061), read his history, and see follow-ups coming due, without ever confusing it with Roll Call's check-in.

## Learning objectives

By the end, the viewer can:

- Log a mentor check-in from a youth's record or from the history.
- Explain what the server requires and what it audits.
- Say who reads a mentor check-in and what private notes are.
- Find follow-ups on the Mentoring dashboard and read Overdue.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Who can read a mentor check-in? | Only the mentor who wrote it, for youth still in his scope; another mentor, other roles and other organizations never |
| What is required? | Youth, date (not in the future), how they met, how it went; follow-up not before the date |
| What do private notes protect? | Words that never leave the mentor, even when the check-in is shared |
| Where do follow-ups come from? | His latest check-in with each youth that has a follow-up date |

## Code / assets on screen

| File | What to show |
|---|---|
| `frontend/projects/mentoring/src/lib/mentor-check-in-dialog/` | The Log a mentor check-in dialog |
| `frontend/projects/mentoring/src/lib/mentor-check-ins-page/` | The history with its filters |
| `backend/src/PromiseHub.Application/Mentoring/MentorCheckInsHandler.cs` | Scope, checks, audit, history |
| `backend/src/PromiseHub.Application/Mentoring/MentorDashboardHandler.cs` | Follow-ups |
| `backend/tests/PromiseHub.Api.Tests/MentorCheckInsTests.cs` | API acceptance tests |
| `e2e/tests/mentoring/mentor-check-in*.spec.ts`, `mentor-follow-ups.spec.ts` | Browser acceptance tests |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:25 | Introduction | Mentor check-ins, not Roll Call |
| 00:25-01:00 | Logging | Mateo's record, the dialog, saved |
| 01:00-01:25 | Server checks | Required fields, dates, audit |
| 01:25-01:45 | Private notes | Sharing off by default |
| 01:45-02:25 | History | List, filters, logging for Sofía |
| 02:25-02:50 | Follow-ups | The dashboard card, Overdue |
| 02:50-03:15 | Who reads | Author only, refusals, Mentoring off |
| 03:15-03:25 | Phone | One column, bottom sheet |
| 03:25-03:45 | States | Invalid, failed, empty |
| 03:45-04:05 | Testing | API and browser tests |
| 04:05-04:20 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend start
node tools/video-record/record-clips.mjs docs/videos/67-record-mentor-check-ins
node tools/video-audio/generate-audio.mjs docs/videos/67-record-mentor-check-ins
node tools/video-build/build-video.mjs docs/videos/67-record-mentor-check-ins
```

## Pitfalls

- Saying "check-in" alone: always "mentor check-in".
- Expecting another mentor of the same youth to read a check-in; only its author does.
- Expecting the youth or guardian to see a shared check-in yet; that view arrives with the guardian portal (prompt 73).

## References

- [`L2-090`](../../specs/L2.md) · [ADR 0061](../../adr/0061-a-mentor-check-in-is-read-only-by-the-mentor-who-wrote-it.md) · [Design](../../detailed-designs/mentoring/record-mentor-check-ins/README.md)
