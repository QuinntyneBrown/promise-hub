# 60 · Author quizzes and assignments

> **Runtime:** ~5 min · **Audience:** contributors, product owners and program staff · **Prerequisites:** [56 · Author curriculum](../56-author-curriculum/README.md)

**Video:** [60-author-quizzes-and-assignments.mp4](60-author-quizzes-and-assignments.mp4) · [Slides](slides.html) · **Audio:** [60-author-quizzes-and-assignments.mp3](60-author-quizzes-and-assignments.mp3) · [Transcript](script.md)

## Why this video exists

Slice 60 brings Waypoint's quiz builder and assignment builder into PromiseHub: a program director builds a module's quiz with questions of four types, its pass mark, attempts and feedback, and an assignment with its task, ways to submit, rubric and due rules, and publishes them (`L2-073`, `L2-074`, ADR 0054).

## Learning objectives

By the end, the viewer can:

- Create a quiz or an assignment from the module editor and attach it to the module or a lesson.
- Write questions of each type and say what the server checks for each.
- Set a quiz's pass mark, attempts, feedback, shuffle and required flag.
- Build an assignment's rubric and explain where the total comes from.
- Say what publishing needs, and who is refused.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Where do quizzes and assignments live? | A module's Quizzes and assignments card; `POST /curriculum/quizzes`, `POST /curriculum/assignments`; attached to the whole module or a live lesson of it |
| What does each question type need? | Multiple choice 2 to 6 options and one correct; true or false one of True and False; multiple answer at least one correct; short answer 1 to 10 accepted answers |
| What are a quiz's rules? | Pass mark 1 to 100%, attempts 1 to 10 or unlimited, feedback after each attempt, score only or after the last, shuffle, required to complete |
| Where does the rubric total come from? | Criteria of 1 to 100 points, up to 10, saved with the assignment; the server sums and stores it |
| What does publishing need? | A quiz needs a question; an assignment a task and a criterion; youth see it only inside a published module and track their cohort follows |
| What is refused? | Other roles 403; Learning off and another organization 404; correct answers only to authors |

## Code / assets on screen

| File | What to show |
|---|---|
| `frontend/projects/curriculum/src/lib/quiz-builder-page/` | The quiz builder |
| `frontend/projects/curriculum/src/lib/quiz-question-dialog/` | One dialog for four types |
| `frontend/projects/curriculum/src/lib/assignment-builder-page/` | The assignment builder and its rubric |
| `backend/src/PromiseHub.Application/Curriculum/QuestionRules.cs` | The per-type checks |
| `backend/src/PromiseHub.Application/Curriculum/AssignmentCommands.cs` | The rubric and its total |
| `docs/adr/0054-quizzes-and-assignments-belong-to-modules.md` | The decisions |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:25 | Introduction | What a program director builds |
| 00:25-01:40 | A quiz for the module and four kinds of question | New quiz, the question dialog and its checks |
| 01:40-02:24 | The rules | Order, pass mark, attempts, feedback, publish |
| 02:24-03:25 | An assignment and its rubric | Task, ways to submit, rubric of 25 points, due rules, publish |
| 03:25-03:34 | On a phone | The builder stacked |
| 03:34-04:16 | Refused, empty and off | Publish refusals, invalid, not found, error, forbidden, Learning off |
| 04:16-04:44 | How it is tested | API and browser tests |
| 04:44-05:13 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend start
node tools/video-record/record-clips.mjs docs/videos/60-author-quizzes-and-assignments
node tools/video-audio/generate-audio.mjs docs/videos/60-author-quizzes-and-assignments
node tools/video-build/build-video.mjs docs/videos/60-author-quizzes-and-assignments --no-captions
```

## Pitfalls

- The rubric is not saved until Save assignment; leaving the page drops unsaved criteria.
- Editing a published quiz is allowed until youth attempts exist (prompt 61).
- A question's blank options at the end are dropped; a blank one in the middle is refused.

## References

- [L2-073 and L2-074](../../specs/L2.md)
- [ADR 0054](../../adr/0054-quizzes-and-assignments-belong-to-modules.md)
- [author-quizzes](../../detailed-designs/curriculum/author-quizzes/README.md), [author-assignments](../../detailed-designs/curriculum/author-assignments/README.md)
