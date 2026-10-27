# 57 · Complete lessons

> **Runtime:** ~4.5 min · **Audience:** contributors, product owners and program staff · **Prerequisites:** [56 · Author curriculum](../56-author-curriculum/README.md)

**Video:** [57-complete-lessons.mp4](57-complete-lessons.mp4) · [Slides](slides.html) · **Audio:** [57-complete-lessons.mp3](57-complete-lessons.mp3) · [Transcript](script.md)

## Why this video exists

Slice 57 brings Waypoint's most valuable journey into PromiseHub: a youth opens Learning, browses the tracks her programs follow, works through modules and lessons that unlock in order, watches lesson video, completes reading and scripture lessons, and does coding lessons and projects, with progress saved and every lock enforced on the server (`L2-068`, `L2-069`, `L2-070`, ADR 0051).

## Learning objectives

By the end, the viewer can:

- Say which content a youth sees and how modules and lessons unlock.
- Describe what Mark complete saves, and how coding lessons and projects complete instead.
- Explain how a lesson video reaches only a youth who may open the lesson, and how it supports seeking.
- Explain why the coding preview cannot run a youth's script.

## Key questions

| Question | What a strong answer includes |
|---|---|
| What does a youth see? | Published content of published tracks followed by her active programs, in her organization |
| When is a module or lesson locked? | Module: its published prerequisite is not done. Lesson: its module is locked or an earlier lesson is not done; 403 `locked` with `unlockAfter` |
| What does completing save? | One `LessonProgress` row per youth and lesson, audited once; coding kinds 409 on complete |
| How does the video stream? | `GET /learning/lessons/{id}/video` under the session, range requests, `IFileStore.OpenReadAsync` |
| How is the preview safe? | `sandbox="allow-scripts"` with its own origin and a CSP of `default-src 'none'` |
| Who is refused? | Staff, mentors and volunteers 403; no consent 403 `consent-required`; no program 403 `no-cohort`; Learning off or another organization 404 |

## Code / assets on screen

| File | What to show |
|---|---|
| `frontend/projects/learning/src/lib/learning-page/` | `learn-home` |
| `frontend/projects/learning/src/lib/track-page/`, `module-page/` | `learn-track` with `ph-button-group`, `learn-module` |
| `frontend/projects/learning/src/lib/lesson-page/` | `learn-lesson`, `learn-lesson-scripture` with `ph-scripture-block` and `ph-video-player` |
| `frontend/projects/learning/src/lib/coding-page/`, `submit-project-dialog/` | `learn-coding-lesson`, `learn-coding-project`, `submit-project` |
| `frontend/projects/components/src/lib/code-playground/` | The sandboxed preview |
| `backend/src/PromiseHub.Application/Learning/LearnerProgress.cs` | Visibility and locks |
| `backend/src/PromiseHub.Api/Endpoints/LearningEndpoints.cs` | The gates and the video stream |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:23 | Introduction | What the journey does |
| 00:23-01:05 | Learning home and tracks | Clip: home, track, track switch |
| 01:05-01:35 | Modules unlock in order | The rule, a locked module on a phone |
| 01:35-02:00 | Reading a lesson | Clip: module, video, Mark complete, scripture lesson with A+ |
| 02:00-02:21 | The lesson video | Playing, and failed with Retry |
| 02:21-03:03 | Coding lessons and projects | Clip: write, run, tick, complete, submit; the submitted project |
| 03:03-03:27 | Empty, failed and off | Clip and the refusals |
| 03:27-03:52 | How it is tested | Test classes and specs; phone clip |
| 03:52-04:16 | Recap | Three things to remember |

## Demo commands

```sh
npm --prefix frontend run start -- --port 4317
node tools/video-record/record-clips.mjs docs/videos/57-complete-lessons --base http://localhost:4317
PYTHON=python3 node tools/video-audio/generate-audio.mjs docs/videos/57-complete-lessons
node tools/video-build/build-video.mjs docs/videos/57-complete-lessons --no-captions
```

## Pitfalls

- Authoring a lesson's kind, passage, starter code and coding steps is deferred; the API tests and the fake set them directly.
- Saving the reading size and a bookmark, reflections, quizzes, badges and mentor review of projects arrive with later journeys.
- Angular's HTML sanitizer strips `srcdoc`; the playground trusts its own preview document, which renders only in the sandboxed frame.

## References

- `docs/specs/L2.md` (`L2-068` to `L2-070`), `docs/adr/0051-youth-progress-gating-video-streaming-and-coding.md`
- `docs/detailed-designs/learning/` (browse-curriculum, complete-lessons, stream-lesson-video, complete-coding-lessons, submit-coding-projects)
