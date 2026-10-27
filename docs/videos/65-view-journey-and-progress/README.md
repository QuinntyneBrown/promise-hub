# 65 · View journey and progress

> **Runtime:** ~5 min · **Audience:** contributors, product owners and program staff · **Prerequisites:** [61 · Take quizzes](../61-take-quizzes/README.md), [64 · Author badges and progression](../64-author-badges-and-progression/README.md)

**Video:** [65-view-journey-and-progress.mp4](65-view-journey-and-progress.mp4) · [Slides](slides.html) · **Audio:** [65-view-journey-and-progress.mp3](65-view-journey-and-progress.mp3) · [Transcript](script.md)

## Why this video exists

Slice 65 brings Waypoint's youth journey, badges and progress pages into PromiseHub: a youth sees her roadmap through the tracks her programs follow, her weekly streak, her progression stage, the badges she has earned and those still locked, and her own quizzes, attendance and competencies (`L2-087`, `L2-088`, ADR 0059).

## Learning objectives

By the end, the viewer can:

- Open the journey, badges and progress from Learning and say what each shows.
- Explain how the streak and the stage are counted.
- Say which badges a youth sees and how far she is on each.
- Say what changes when Roll Call is off, and who is refused.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Where do the numbers come from? | Computed on read from `LearnerProgress`, lesson completions, awards and assessments; the same counts as Learning |
| How is the streak counted? | Weeks in a row, Monday to Sunday UTC, with a lesson completed, from this week or last week |
| How is the stage decided? | Earned when every competency in it is Proficient or Mastered by the latest assessment; the first not earned is current |
| Which badges does she see? | By hand, and automatic with a target in a followed track; earned ones always, even if deleted |
| What about attendance? | Only while Roll Call is on: her marked sessions, newest first, and the rate |
| What is refused? | No consent or no program 403; staff 403; another organization never; Learning off 404 and the routes go to Today |

## Code / assets on screen

| File | What to show |
|---|---|
| `frontend/projects/learning/src/lib/journey-page/` | Your journey |
| `frontend/projects/learning/src/lib/badges-page/` | Badges |
| `frontend/projects/learning/src/lib/progress-page/` | Your progress and its tabs |
| `frontend/projects/components/src/lib/achievement-badges/` | `ph-achievement-badges` |
| `backend/src/PromiseHub.Application/Learning/JourneyHandler.cs` | The journey read |
| `backend/src/PromiseHub.Application/Learning/LearnerStreak.cs` | The weekly streak |
| `backend/src/PromiseHub.Application/Learning/LearnerStanding.cs` | Stages from assessments |
| `docs/adr/0059-the-journey-is-computed-on-read-with-a-weekly-streak-and-stages-from-assessments.md` | The decisions |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:25 | Introduction | What a youth sees and why |
| 00:25-01:05 | Your journey | Numbers, roadmap, Continue |
| 01:05-01:40 | Streak and stage | How each is counted |
| 01:40-02:30 | Badges | Earned, still to unlock, milestones |
| 02:30-03:00 | Your progress | Overview, Quizzes, Attendance |
| 03:00-03:08 | On a phone | One column |
| 03:08-03:50 | Empty, refused and off | Empty, no badges, Roll Call off, failed, not open, Learning off |
| 03:50-04:15 | How it is tested | API and browser tests |
| 04:15-04:40 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend start -- --port 4317
node tools/video-record/record-clips.mjs docs/videos/65-view-journey-and-progress --base http://localhost:4317
node tools/video-audio/generate-audio.mjs docs/videos/65-view-journey-and-progress
node tools/video-build/build-video.mjs docs/videos/65-view-journey-and-progress --no-captions
```

## Pitfalls

- The streak counts completed lessons only; attendance does not extend it.
- Competency levels show whenever Learning is on, even with Mentoring off, because the framework is Learning's.
- A badge whose target is not in a followed track is hidden until a program follows that track.

## References

- [L2-087 and L2-088](../../specs/L2.md)
- [ADR 0059](../../adr/0059-the-journey-is-computed-on-read-with-a-weekly-streak-and-stages-from-assessments.md)
- [view-learning-journey](../../detailed-designs/learning/view-learning-journey/README.md), [view-badges](../../detailed-designs/learning/view-badges/README.md), [review-personal-progress](../../detailed-designs/learning/review-personal-progress/README.md)
