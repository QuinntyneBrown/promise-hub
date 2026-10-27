# 61 · Take quizzes

> **Runtime:** ~4.7 min · **Audience:** contributors, product owners and program staff · **Prerequisites:** [57 · Complete lessons](../57-complete-lessons/README.md), [60 · Author quizzes and assignments](../60-author-quizzes-and-assignments/README.md)

**Video:** [61-take-quizzes.mp4](61-take-quizzes.mp4) · [Slides](slides.html) · **Audio:** [61-take-quizzes.mp3](61-take-quizzes.mp3) · [Transcript](script.md)

## Why this video exists

Slice 61 brings Waypoint's quiz taking into PromiseHub: a youth reads a quiz's rules, takes it one question at a time with every answer saved on the server, submits it, after which the attempt is scored on the server and never changes, and sees her score and a review as the quiz allows; the attempt limit is enforced and her best score counts (`L2-075`, `L2-076`, ADR 0055).

## Learning objectives

By the end, the viewer can:

- Say when a quiz unlocks and what the intro tells a youth.
- Describe how answers autosave and how an attempt resumes, offline included.
- Explain where scoring happens and why a submitted attempt cannot change.
- Say what each feedback rule shows, what approval holds back and how a required quiz completes a module.

## Key questions

| Question | What a strong answer includes |
|---|---|
| When is a quiz open? | Whole-module quiz: every published lesson done; lesson quiz: its lesson done; otherwise 403 `locked` with `unlockAfter` |
| How are answers saved? | `PUT /learning/attempts/{id}/answers` with every answer and the position, one save at a time; offline keeps them and retries on `online` |
| Who scores? | `QuizScoring` on the server at `POST /learning/attempts/{id}/submit`; then 409 `submitted` |
| How many attempts? | `AttemptsAllowed` or unlimited; past it 409 `no-attempts`; the best scored attempt counts |
| What does she see after? | Show answers, score only, or after the last attempt; nothing scored while a mentor must approve |
| Who is refused? | Staff and mentors 403; no consent 403 `consent-required`; another organization or Learning off 404 |

## Code / assets on screen

| File | What to show |
|---|---|
| `frontend/projects/learning/src/lib/quiz-intro-page/` | `learn-quiz-intro` |
| `frontend/projects/learning/src/lib/quiz-page/`, `submit-quiz-dialog/` | `learn-quiz`, `submit-quiz` |
| `frontend/projects/learning/src/lib/quiz-result-page/` | `learn-quiz-result` |
| `frontend/projects/components/src/lib/quiz-option/` | `ph-quiz-option`, taking and review |
| `backend/src/PromiseHub.Application/Learning/QuizAttemptCommand.cs`, `QuizScoring.cs`, `QuizResultHandler.cs` | Start, save, submit, score and result |
| `backend/src/PromiseHub.Domain/Learning/QuizAttempt.cs` | The attempt and its lock |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:26 | Introduction | What the journey does |
| 00:26-01:16 | The rules and the questions | Clip: module, intro, four questions saved as she goes, submit, result |
| 01:16-01:43 | Saved as she goes | The endpoints and the rules for answers |
| 01:43-02:10 | Submitting | The dialog, scoring, the lock |
| 02:10-02:40 | Her result | Score, review, the module complete |
| 02:40-02:58 | Trying again | Clip: not this time, last attempt, resume |
| 02:58-03:14 | On a phone | Clip |
| 03:14-03:54 | Locked, offline and the rest | Clip and the feedback rules |
| 03:54-04:20 | How it is tested | Test classes and spec |
| 04:20-04:43 | Recap | Three things to remember |

## Demo commands

```sh
npm --prefix frontend run start -- --port 4317
node tools/video-record/record-clips.mjs docs/videos/61-take-quizzes --base http://localhost:4317
PYTHON=python3 node tools/video-audio/generate-audio.mjs docs/videos/61-take-quizzes
node tools/video-build/build-video.mjs docs/videos/61-take-quizzes --check
node tools/video-build/build-video.mjs docs/videos/61-take-quizzes --no-captions
```

## Pitfalls

- The clips use their own fake API in `clips/clips.mjs`; keep it in step with `e2e/fixtures/fake-quiz-taking.ts`.
- Offline in the clips is the fake aborting saves plus an `online` event, since routed requests ignore the browser's offline mode.

## References

- [L2-075 and L2-076](../../specs/L2.md), [ADR 0055](../../adr/0055-quiz-attempts-are-scored-on-the-server-and-the-best-counts.md)
- [take-quizzes](../../detailed-designs/learning/take-quizzes/README.md), [review-quiz-results](../../detailed-designs/learning/review-quiz-results/README.md)
