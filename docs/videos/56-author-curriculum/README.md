# 56 · Author curriculum

> **Runtime:** ~5 min · **Audience:** contributors, product owners and program directors · **Prerequisites:** [54 · Manage cohorts and assign mentors](../54-manage-cohorts/README.md)

**Video:** [56-author-curriculum.mp4](56-author-curriculum.mp4) · [Slides](slides.html) · **Audio:** [56-author-curriculum.mp3](56-author-curriculum.mp3) · [Transcript](script.md)

## Why this video exists

Slice 56 brings Waypoint's curriculum authoring into PromiseHub: a program director builds tracks of ordered modules and lessons, moves them through draft, review and publish, attaches a lesson video through PromiseHub file storage, and chooses the cohorts that follow each track; nothing unpublished reaches youth (`L2-066`, `L2-067`, ADR 0050).

## Learning objectives

By the end, the viewer can:

- Build a track, add modules and lessons, and reorder them with Move up and Move down.
- Explain the statuses a track, module and lesson can take, and what each needs before publishing.
- Describe how a lesson video is checked and stored, and what is deferred.
- Link a track to cohorts and say why a cohort follows one track.

## Key questions

| Question | What a strong answer includes |
|---|---|
| How is order saved? | The whole list of ids, refused unless it is every item exactly once |
| When does a youth see a lesson? | Lesson, module and track all published, and the youth's program follows the track |
| What blocks publishing? | A module with no lessons; a lesson with no teaching content |
| How is a video checked? | Extension, content type, first bytes (`ftyp` or WebM), up to 1 GB; stored by a generated key |
| Who may author? | Admins and program directors; others 403; another organization 404; Learning off 404 |

## Code / assets on screen

| File | What to show |
|---|---|
| `frontend/projects/curriculum/src/lib/curriculum-tracks-page/` | `curriculum-tracks` with Move up and Move down |
| `frontend/projects/curriculum/src/lib/module-editor-page/` | `curriculum-module` |
| `frontend/projects/curriculum/src/lib/lesson-editor-page/` | `curriculum-lesson` with the Video card |
| `frontend/projects/curriculum/src/lib/track-cohorts-dialog/` | `track-cohorts` |
| `backend/src/PromiseHub.Api/Endpoints/CurriculumEndpoints.cs` | The Learning gate and `AuthorCurriculum` |
| `backend/src/PromiseHub.Application/Curriculum/LessonVideoPolicy.cs` | The video checks |
| `backend/src/PromiseHub.Infrastructure/Storage/LocalFileStore.cs` | File storage behind `IFileStore` |
| `docs/adr/0050-curriculum-tracks-modules-lessons-and-lesson-video.md` | The decisions |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:23 | Introduction | What the video covers |
| 00:23-01:09 | Tracks | Clip: Curriculum, Art Club, reorder; screenshots |
| 01:09-01:43 | Module | The module editor |
| 01:43-02:06 | Lesson | Clip: Add lesson, write, save, publish |
| 02:06-02:40 | Publish | The status table; published and refused |
| 02:40-03:25 | Video | Clip: refused, uploading, attached; the checks |
| 03:25-03:53 | Cohorts | Clip on a phone: Digital Skills' cohorts; screenshots |
| 03:53-04:19 | States | Clip: invalid module, empty, failed, Learning off; who gets what |
| 04:19-04:45 | Testing | What the tests prove |
| 04:45-05:16 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend run start -- --port 4317
node tools/video-record/record-clips.mjs docs/videos/56-author-curriculum --base http://localhost:4317
PYTHON=python3 node tools/video-audio/generate-audio.mjs docs/videos/56-author-curriculum
node tools/video-build/build-video.mjs docs/videos/56-author-curriculum --no-captions
```

## Pitfalls

- Youth reads (prompt 57) must apply the visibility rule: lesson, module and track published, and the program following the track.
- Leader notes are returned only by authoring endpoints; a youth contract must be built field by field.
- The API client uses `withFetch()`, so uploads report no percentage; chunked upload and transcoding are deferred (ADR 0050).
- A hosted deployment needs shared storage under `Storage:RootPath`, or another `IFileStore` adapter.

## References

- `docs/specs/L2.md` (`L2-066`, `L2-067`)
- `docs/detailed-designs/curriculum/author-tracks-and-modules`, `curriculum/author-lessons`, `curriculum/upload-lesson-video`
