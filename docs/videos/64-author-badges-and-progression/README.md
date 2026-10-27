# 64 · Author badges and progression

> **Runtime:** ~5 min · **Audience:** contributors, product owners and program staff · **Prerequisites:** [60 · Author quizzes and assignments](../60-author-quizzes-and-assignments/README.md), [63 · Grade and assess](../63-grade-and-assess/README.md)

**Video:** [64-author-badges-and-progression.mp4](64-author-badges-and-progression.mp4) · [Slides](slides.html) · **Audio:** [64-author-badges-and-progression.mp3](64-author-badges-and-progression.mp3) · [Transcript](script.md)

## Why this video exists

Slice 64 brings Waypoint's badge builder and progression editor into PromiseHub: a program director defines badges earned by one rule or by hand, awards a badge by hand, and authors the progression framework of stages and the competencies mentors assess; the server awards automatic badges after each learning event (`L2-084` to `L2-086`, ADR 0058).

## Learning objectives

By the end, the viewer can:

- Create a badge, choose how it is earned and what it counts toward.
- Name the four automatic rules and the learning events that trigger them.
- Award a badge by hand and say what is recorded.
- Add, edit and reorder stages and add or remove competencies.
- Say who is refused and what happens with Learning off.

## Key questions

| Question | What a strong answer includes |
|---|---|
| How is a badge earned? | Automatically by one rule (lesson, module, quiz, assignment) and its target, or by hand; optionally counting toward a competency |
| When are automatic badges awarded? | After a lesson is completed, a quiz attempt scored, a quiz result approved or a submission accepted; `BadgeAwarder` checks every automatic badge not held; once per badge and youth |
| What does an award by hand record? | The program director's name and the time; the youth is notified and the award audited; 409 already-awarded, 409 automatic, 422 for a youth outside the organization |
| What is the progression framework? | Ordered stages of the competencies mentors assess; new competencies go last on the mentor's sheet; removing one keeps its assessments |
| What is refused? | Other roles 403; another organization 404; Learning off 404 and the routes go to Today |

## Code / assets on screen

| File | What to show |
|---|---|
| `frontend/projects/curriculum/src/lib/badges-page/` | The Badges list |
| `frontend/projects/curriculum/src/lib/badge-builder-page/` | The builder, preview and Earned by |
| `frontend/projects/curriculum/src/lib/award-badge-dialog/` | Award a badge by hand |
| `frontend/projects/curriculum/src/lib/progression-page/` | The progression framework |
| `frontend/projects/components/src/lib/achievement-badge/` | `ph-achievement-badge` |
| `backend/src/PromiseHub.Application/Curriculum/BadgeAwarder.cs` | The automatic rules |
| `docs/adr/0058-badges-are-evaluated-after-learning-events-and-stages-group-competencies.md` | The decisions |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:23 | Introduction | What a program director defines |
| 00:23-01:09 | Badges | The list, New badge, an automatic badge for a module |
| 01:09-01:55 | Earned automatically | The four rules, the events, once per youth |
| 01:55-02:25 | Awarded by hand | Speaks Up to Nadia; already awarded |
| 02:25-03:09 | The progression framework | Stages, a new stage, a competency added and removed |
| 03:09-03:17 | On a phone | One column |
| 03:17-03:52 | Refused, empty and off | Invalid, failed, no badges, forbidden, Learning off |
| 03:52-04:20 | How it is tested | API and browser tests |
| 04:20-04:50 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend start -- --port 4317
node tools/video-record/record-clips.mjs docs/videos/64-author-badges-and-progression --base http://localhost:4317
node tools/video-audio/generate-audio.mjs docs/videos/64-author-badges-and-progression
node tools/video-build/build-video.mjs docs/videos/64-author-badges-and-progression --no-captions
```

## Pitfalls

- Badges are not back-filled when they are created; a youth who already meets a rule earns it on her next learning event.
- Changing a badge's rule never takes it away from youth who earned it.
- Removing a competency hides it from mentors but keeps every assessment; stages cannot be deleted yet.

## References

- [L2-084 to L2-086](../../specs/L2.md)
- [ADR 0058](../../adr/0058-badges-are-evaluated-after-learning-events-and-stages-group-competencies.md)
- [author-badges](../../detailed-designs/curriculum/author-badges/README.md), [award-badges](../../detailed-designs/curriculum/award-badges/README.md), [author-progression-framework](../../detailed-designs/curriculum/author-progression-framework/README.md)
