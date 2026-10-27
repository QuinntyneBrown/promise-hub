# 0058: Badges are evaluated after each learning event and awarded once; stages group the existing competencies

- Status: accepted
- Date: 2026-10-27

## Context

Prompt 64 ports Waypoint's badge builder, badge awarding and progression editor (`L2-CURRIC-005`, `L2-CURRIC-006`) as `L2-084` to `L2-086`. Waypoint stores a badge's rule as a free string (`module-completed`, `quiz-passed`, …) with a target id, archives deleted badges, awards quiz badges from `QuizBadgeAwarder` when a quiz is approved, lets mentors and administrators award by hand, and keeps progression stages with their competencies under curriculum authoring. PromiseHub already has lesson progress (ADR 0051), scored and approved quiz attempts (ADR 0055, ADR 0057), accepted submissions (ADR 0056) and, since prompt 63, each organization's seeded `Competency` rows that mentors assess (ADR 0057).

## Decision

- **Badge.** `Badge` (organization, name, icon from a fixed set, description, kind `Automatic` or `Manual`, rule, target, optional competency, created, deleted) lives in `Domain/Curriculum`. The rule is an enum: `LessonCompleted`, `ModuleCompleted`, `QuizPassed`, `AssignmentAccepted`; the target must be a live lesson, a module, a quiz or an assignment of the organization. A by-hand badge stores no rule. Waypoint's attendance-streak rule waits for cohort session attendance (prompt 71). Deleting sets `DeletedAt`: the badge disappears from authoring, is never awarded again, and its awards are kept.
- **Award.** `BadgeAward` (organization, badge, youth membership, time, awarder name or null) is unique per badge and membership. Awards belong to the youth membership, as lesson progress and attempts do.
- **Evaluation.** `BadgeAwarder.AwardAsync(membershipId)` checks every automatic, not deleted badge of the organization that the youth does not hold against her current records and awards each rule she meets. It runs after the save of each learning event: lesson completion (which also covers coding checklists and projects), quiz submission, quiz approval (one and all) and an accepted grade. Re-checking every rule, not only the one the event touched, keeps the logic in one place and also awards a badge created after a youth already met it, on her next event; badges are not back-filled when they are created. Module completion follows the youth's module page (every published lesson done and every required published quiz passed, in a published module with at least one published lesson). A race that inserts the same award twice is stopped by the unique index and ignored.
- **Who awards by hand.** Only `AuthorCurriculum` (admins and program directors). Waypoint's mentor award is deferred; a mentor asks a program director.
- **Telling the youth.** Each award adds an in-app `Notification` to the youth's membership; push and email wait for prompt 75. Every award is audited Created on `BadgeAward`.
- **Stages.** `ProgressionStage` (organization, position, name, description) lives in `Domain/Curriculum`. The existing `Competency` gains `StageId` and `RemovedAt` instead of a second competency table, so the mentor's sheet and the framework are the same rows. A new competency is placed after every competency of the organization, so the mentor's sheet keeps its order; removing one sets `RemovedAt`, hides it from the sheet and keeps its assessments. The migration puts any competency without a stage into a first stage, Stage 1, of its organization; the seeder adds Explorer, Contributor and Leader at Harbourview and Explorer and Contributor at Northgate over the seeded competencies. Stages use "stage" in code and copy; "level" stays the competency level a mentor sets.
- **Not ported yet.** Deleting a stage, moving or renaming a competency, a youth's current stage (prompt 65) and framework reports (prompt 80).

## Consequences

- Every learning handler that can complete something calls `BadgeAwarder` after its save; a new kind of learning event must do the same.
- Prompt 65 reads `BadgeAward`, `Badge` and the stages to show earned and locked badges and the youth's stage.
