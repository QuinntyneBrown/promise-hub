# 63 · Grade and assess

> **Runtime:** ~5.1 min · **Audience:** contributors, product owners and program staff · **Prerequisites:** [55 · Use the mentor dashboard](../55-use-the-mentor-dashboard/README.md), [61 · Take quizzes](../61-take-quizzes/README.md), [62 · Submit assignments](../62-submit-assignments/README.md)

**Video:** [63-grade-and-assess.mp4](63-grade-and-assess.mp4) · [Slides](slides.html) · **Audio:** [63-grade-and-assess.mp3](63-grade-and-assess.mp3) · [Transcript](script.md)

## Why this video exists

Slice 63 brings Waypoint's grading, quiz approval and competency assessment into PromiseHub: a mentor works a review queue of their youth's work, grades a submission against its rubric and approves it, sends it back or keeps a draft, approves or overrides quiz results that need a mentor, and records competency levels with notes; a save against a stale version is refused (`L2-080` to `L2-083`, ADR 0057).

## Learning objectives

By the end, the viewer can:

- Say what reaches a mentor's review queue and what never does.
- Describe how a grade is checked, totalled and saved, and what draft, approve and revise each do.
- Explain how a stale grade is detected and what the page offers.
- Describe quiz approval with an override and approve all, and which score counts.
- Describe how competency assessments are kept and shown.

## Key questions

| Question | What a strong answer includes |
|---|---|
| What is in the queue? | Submitted or In review submissions and quiz attempts awaiting approval of the mentor's youth, oldest first; Mentoring and Learning on |
| What does opening a submission do? | Moves Submitted to In review once, with a Review started step, audited |
| How is a grade checked? | Each score 0 to its criterion's points; approve needs every criterion; revise needs a note; 409 `not-reviewable` once graded |
| What stops a lost update? | `AssignmentSubmission.Version`, sent with every grade; 409 `stale`, also on an EF Core concurrency failure; one save for everything |
| Which quiz score counts? | The approved one: the override (0 to 100) or the auto-score; `AutoScore` kept for the audit |
| How are competencies kept? | One `CompetencyAssessment` per changed competency, appended; the latest shows; Mentoring only |

## Code / assets on screen

| File | What to show |
|---|---|
| `frontend/projects/mentoring/src/lib/reviews-page/`, `grade-page/` | `mentor-reviews`, `mentor-grade` |
| `frontend/projects/mentoring/src/lib/approve-submission-dialog/`, `request-revision-dialog/`, `leave-grade-dialog/` | The grade dialogs |
| `frontend/projects/mentoring/src/lib/quiz-approvals-page/`, `approve-quiz-dialog/`, `approve-all-quizzes-dialog/` | `mentor-quiz-approvals` and its dialogs |
| `frontend/projects/mentoring/src/lib/competencies-page/` | `mentor-competency` |
| `backend/src/PromiseHub.Application/Mentoring/ReviewQueueHandler.cs`, `SubmissionReviewHandler.cs`, `GradeSubmissionHandler.cs` | Queue, review and grade |
| `backend/src/PromiseHub.Application/Mentoring/QuizApprovalHandler.cs`, `CompetenciesHandler.cs` | Quiz approvals and competencies |
| `backend/src/PromiseHub.Domain/Learning/AssignmentSubmission.cs`, `QuizAttempt.cs`, `backend/src/PromiseHub.Domain/Mentoring/Competency*.cs` | Version, approval, competencies |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:23 | Introduction | What the journey does |
| 00:23-01:00 | The review queue | Clip and the scope rule |
| 01:00-01:35 | Grading a submission | Clip: rubric, comment, Approve, Accepted |
| 01:35-01:57 | Drafts and revisions | Clip: Save draft, Request revision |
| 01:57-02:26 | What the server checks | Refusals and the stale version |
| 02:26-03:02 | Quiz approvals | Clip: override and Approve all; which score counts |
| 03:02-03:37 | Competencies | Clip and how assessments are kept |
| 03:37-03:48 | On a phone | Clip |
| 03:48-04:15 | The other states | Clip: invalid, stale, failed, forbidden, caught up, Learning off |
| 04:15-04:40 | How it is tested | Test classes and specs |
| 04:40-05:06 | Recap | Four things to remember |

## Demo commands

```sh
npm --prefix frontend run start -- --port 4317
node tools/video-record/record-clips.mjs docs/videos/63-grade-and-assess --base http://localhost:4317
PYTHON=python3 node tools/video-audio/generate-audio.mjs docs/videos/63-grade-and-assess
node tools/video-build/build-video.mjs docs/videos/63-grade-and-assess --check
node tools/video-build/build-video.mjs docs/videos/63-grade-and-assess --no-captions
```

## Pitfalls

- The clips use their own fake API in `clips/clips.mjs`; keep it in step with `e2e/fixtures/fake-reviews.ts`.
- Competencies are seeded per organization until prompt 64 lets program directors author them.

## References

- [L2-080 to L2-083](../../specs/L2.md), [ADR 0057](../../adr/0057-mentor-reviews-grade-in-place-with-a-version-and-competencies-are-appended.md)
- [grade-submissions](../../detailed-designs/mentoring/grade-submissions/README.md), [approve-quiz-assessments](../../detailed-designs/mentoring/approve-quiz-assessments/README.md), [assess-competencies](../../detailed-designs/mentoring/assess-competencies/README.md), [protect-concurrent-updates](../../detailed-designs/platform/protect-concurrent-updates/README.md)
