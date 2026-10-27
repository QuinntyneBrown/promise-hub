# 66 · Write reflections

> **Runtime:** ~4 min · **Audience:** contributors, product owners and program staff · **Prerequisites:** [57 · Complete lessons](../57-complete-lessons/README.md), [62 · Submit assignments](../62-submit-assignments/README.md)

**Video:** [66-write-reflections.mp4](66-write-reflections.mp4) · [Slides](slides.html) · **Audio:** [66-write-reflections.mp3](66-write-reflections.mp3) · [Transcript](script.md)

## Why this video exists

Slice 66 brings Waypoint's youth reflections into PromiseHub: a youth reflects on a lesson with a mood, her words and one thing she will do, chooses each time whether her mentor may read it, and is asked before she leaves unsaved words (`L2-089`, `L2-079` criterion 5, ADR 0060).

## Learning objectives

By the end, the viewer can:

- Write and save a reflection from a lesson, private or shared.
- Say who can read a reflection, and how the server enforces it.
- Explain what happens when a youth leaves with unsaved words, and where a draft lives.
- Say what is refused and what changes when Learning is off.

## Key questions

| Question | What a strong answer includes |
|---|---|
| What is kept? | One `Reflection` per youth membership and lesson: mood, words, action, shared, when saved; replaced on each save |
| Who reads it? | The youth; her mentor only when shared, through `GET /mentoring/youth/{childId}/reflections` and `MentorScope`; nobody else |
| What is audited? | Created or Updated with Shared before and after, never the words; the mentor's read as Viewed; refusals as AccessDenied |
| Where do drafts live? | On the device, under the membership and lesson (`REFLECTION_DRAFT_STORE`); never on the server |
| What is refused? | Locked lesson 403 with what to finish; no consent 403; other roles 403; another organization 404; Learning off 404 |

## Code / assets on screen

| File | What to show |
|---|---|
| `frontend/projects/learning/src/lib/reflection-page/` | Your reflection |
| `frontend/projects/learning/src/lib/leave-reflection-dialog/` | Leave without saving? |
| `frontend/projects/mentoring/src/lib/mentor-youth-detail-page/` | Shared reflections on the record |
| `frontend/projects/components/src/lib/list/` | `ph-list-item` with its text variant |
| `backend/src/PromiseHub.Application/Learning/ReflectionHandler.cs` | Read and save |
| `backend/src/PromiseHub.Application/Mentoring/SharedReflectionsHandler.cs` | The mentor's read |
| `docs/adr/0060-a-reflection-is-one-row-per-youth-and-lesson-shared-only-with-her-mentor.md` | The decisions |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:20 | Introduction | What a reflection is and who reads it |
| 00:20-01:00 | Writing a reflection | From the lesson: mood, words, action, saved privately |
| 01:00-01:25 | One reflection per lesson | Replaced on save, checks, audit |
| 01:25-01:50 | Sharing | The switch, shared, taken back |
| 01:50-02:30 | What Daniel sees | Shared reflections on the record |
| 02:30-03:05 | Leaving with unsaved words | The dialog, the device draft, restored |
| 03:05-03:12 | On a phone | One column |
| 03:12-03:40 | Refused and off | Invalid, failed, locked, not open, Learning off |
| 03:40-04:05 | How it is tested | API and browser tests |
| 04:05-04:20 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend start -- --port 4317
node tools/video-record/record-clips.mjs docs/videos/66-write-reflections --base http://localhost:4317
node tools/video-audio/generate-audio.mjs docs/videos/66-write-reflections
node tools/video-build/build-video.mjs docs/videos/66-write-reflections --no-captions
```

## Pitfalls

- A draft is per device: a youth who switches phones does not carry an unsaved draft with her; her saved reflection is on the server.
- Sharing is chosen at each save; turning the switch on without saving shares nothing.
- The mentor's card appears only while Learning is on, even if Mentoring is on.

## References

- [L2-089 and L2-079](../../specs/L2.md)
- [ADR 0060](../../adr/0060-a-reflection-is-one-row-per-youth-and-lesson-shared-only-with-her-mentor.md)
- [write-reflections](../../detailed-designs/learning/write-reflections/README.md), [protect-unsaved-work](../../detailed-designs/learning/protect-unsaved-work/README.md)
