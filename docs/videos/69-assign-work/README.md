# 69 · Assign work

> **Runtime:** ~5 min · **Audience:** mentors, youth, developers · **Prerequisites:** [55 · Use the mentor dashboard](../55-use-the-mentor-dashboard/README.md), [57 · Complete lessons](../57-complete-lessons/README.md)

**Video:** [69-assign-work.mp4](69-assign-work.mp4) · [Slides](slides.html) · **Audio:** [69-assign-work.mp3](69-assign-work.mp3) · [Transcript](script.md)

## Why this video exists

Mentors steer individual youth by pointing them at the next thing worth doing. Prompt 69 lets a mentor assign a published lesson, quiz or assignment to chosen youth or a whole cohort he is on, with a due date and an optional message, and shows it on each youth's Learning home until she has done it (`L2-092`, ADR 0063). Assigning needs both Mentoring and Learning.

## Learning objectives

By the end, the viewer can:

- Assign a lesson, quiz or assignment to a cohort or to chosen youth, and say what the server requires.
- Explain why a youth outside the item's track is refused.
- Find assigned work on a youth's Learning home and say when it drops off.
- Say what happens with Learning or Mentoring off.

## Key questions

| Question | What a strong answer includes |
|---|---|
| What can be assigned? | A published lesson, quiz or assignment of a track his youth follow |
| To whom? | Chosen youth in his scope, or one cohort he leads or supports (its active roster) |
| What is required? | The item, who, a due date not in the past; a message is optional, up to 500 characters |
| When does it leave the youth's list? | When she completes the lesson, takes the quiz or hands in the assignment |
| What is audited? | One Created entry with the kind, how many youth and the due date; never the message |

## Code / assets on screen

| File | What to show |
|---|---|
| `frontend/projects/mentoring/src/lib/assign-work-dialog/` | The Assign work dialog |
| `frontend/projects/mentoring/src/lib/mentor-dashboard-page/` | Assign work and the toast |
| `frontend/projects/learning/src/lib/learning-page/` | Assigned to you |
| `backend/src/PromiseHub.Application/Mentoring/AssignWorkHandler.cs` | Options, scope, checks, the track rule, audit |
| `backend/src/PromiseHub.Application/Learning/LearningHomeHandler.cs` | The youth's assigned work |
| `backend/src/PromiseHub.Domain/Mentoring/AssignedWork.cs` | One row per youth and item |
| `backend/tests/PromiseHub.Api.Tests/AssignWorkTests.cs`, `LearningAssignedWorkTests.cs` | API acceptance tests |
| `e2e/tests/mentoring/assign-work.spec.ts`, `e2e/tests/learning/assigned-work.spec.ts` | Browser acceptance tests |
| `shots/` | Dashboard, dialog, chosen youth, assigned, Learning home, lesson, invalid, not followed, failed, error, nothing to assign, Learning off, Mentoring off; phone and desktop |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:23 | Introduction | Steering youth with assigned work |
| 00:23-01:02 | Cohort | Last in Line for After-School Tutoring, the toast |
| 01:02-01:26 | Chosen youth | The quiz for Mateo and Yusuf (at risk) |
| 01:26-02:03 | Server checks | Required fields, the track rule, assigning again, audit |
| 02:03-02:29 | Youth sees | Sofía's Assigned to you, opening the lesson |
| 02:29-03:10 | Who assigns | Scope, roles, tenancy, Learning and Mentoring off |
| 03:10-03:20 | Phone | Bottom sheet, one column |
| 03:20-03:56 | States | Invalid, outside the track, failed, error, nothing to assign |
| 03:56-04:21 | Testing | API and browser tests |
| 04:21-04:45 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend start
node tools/video-record/record-clips.mjs docs/videos/69-assign-work --base http://localhost:4200
node tools/video-audio/generate-audio.mjs docs/videos/69-assign-work
node tools/video-build/build-video.mjs docs/videos/69-assign-work --no-captions
```

## Pitfalls

- Choosing a youth whose cohort follows another track: the server names who doesn't follow it.
- Expecting reminders or a message thread: both are deferred (ADR 0063); the message shows with the work.
- Looking for Assign work with Learning off: it needs Learning content.

## References

- [`L2-092`](../../specs/L2.md) · [ADR 0063](../../adr/0063-assigned-work-is-one-row-per-youth-and-item-shown-on-the-learning-home-until-done.md) · [Design](../../detailed-designs/mentoring/assign-work/README.md)
