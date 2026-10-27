# 0057: A mentor grades a submission in place against its version, approves quiz results onto the attempt, and appends competency assessments

- Status: accepted
- Date: 2026-10-27

## Context

Prompt 63 ports Waypoint's grading, quiz approval and competency assessment (`L2-MENTOR-003` to `L2-MENTOR-005`) and its concurrency rule (`L2-NFR-006`) as `L2-080` to `L2-083`. Waypoint lets a mentor or a program administrator grade with a `Decision` string, stores rubric scores as JSON on the submission, guards the save with a `ConcurrencyStamp` GUID, approves a quiz by writing `ApprovedScore` beside `AutoScore`, and appends `CompetencyAssessment` rows against an authored progression framework of stages and competencies. In PromiseHub the submission, its history and its review methods exist (ADR 0056), a quiz attempt waits in `AwaitingApproval` when its quiz needs a mentor (ADR 0055), a mentor's youth are the children `MentorScope` answers (ADR 0049), and no competency framework is authored yet (prompt 64).

## Decision

- **Queue.** `GET /mentoring/reviews` lists, oldest first, the assignment submissions that are Submitted or In review and the quiz attempts awaiting approval of the youth memberships linked to the mentor's youth (`Membership.ChildId` in `MentorScope.YouthIdsAsync`). Anything else, including another mentor's youth, is never read.
- **Who grades.** Only the `MentorYouth` permission (mentors), for their own youth. Waypoint's administrator override is not ported; a program director reassigns a mentor instead. Another youth's or organization's submission or attempt answers 404, never 403, so ids reveal nothing.
- **Opening starts the review.** The first `GET /mentoring/submissions/{id}` of a Submitted submission calls `StartReview`, writes the Review started step and audits `Updated`. Later reads change nothing, so the read stays idempotent.
- **One grade endpoint.** `POST /mentoring/submissions/{id}/grade` takes `{ decision: "draft" | "approve" | "revise", scores: [{ criterionId, points }], comment, version }`. Scores are checked against the assignment's `RubricCriterion` rows and kept on the submission (`Scores` as JSON keyed by criterion, the draft `ReviewComment`); the youth never reads either. `approve` needs every criterion scored and calls `Accept(total, comment)`; `revise` needs a note and calls `RequestRevision(note)`; both notify the youth in the app (`Notification` for her membership) and are audited `Updated`. A submission already Accepted or Needs revision answers 409 `not-reviewable`.
- **Version.** `AssignmentSubmission.Version` is an integer concurrency token that every change advances (submit, resubmit, review started, draft, approve, revise). The grade carries the version it was read at; a different one answers 409 `stale`, and a race past that check is caught by EF Core's concurrency check and answered the same way. One `SaveChanges` holds the status, scores, history step, notification and audit entry. Other records adopt versions when their journeys need them.
- **Quiz approval.** `QuizAttempt.Approve(override, passMark, by, at)` keeps the auto-score in `AutoScore`, makes the approved score (the override, 0 to 100, or the auto-score) the attempt's `Score`, sets `Passed`, the approver and the time, and moves it to `Scored`, so every existing reader of best score and module completion counts only approved scores. Approve all approves each awaiting attempt of the mentor's youth at its auto-score and audits each. Waypoint's question-by-question review page is not ported.
- **Competencies.** `Competency` (organization, position, name, description) rows are seeded per organization until prompt 64 lets program directors author them; Waypoint's stages are not ported. `CompetencyAssessment` rows (organization, child, competency, level, notes up to 2,000 characters, assessor membership and name, time) are appended, never updated; the latest per competency is what shows. A save sends every competency and appends only those whose level or note changed, each audited `Created`. Assessments belong to the child, not the youth membership, so a youth without an account can be assessed too.
- **Module gates.** Reviews, grading and quiz approval need Mentoring and Learning: their endpoints carry both module gates and their routes match only while both are on (`moduleRoute` takes several modules). Competencies need Mentoring only.
- **Not ported yet.** Badges on approval (prompt 64), telling a guardian about a grade and push or email to the youth (prompts 73 and 75), competencies on the youth's progress view and reports (prompts 65 and 80).

## Consequences

- The youth's submission and quiz pages need no change: they already read `Feedback`, `Points`, `Score` and `Status`.
- Grading from two tabs or by two mentors of the same youth is safe: the second save is refused and the page offers the latest.
