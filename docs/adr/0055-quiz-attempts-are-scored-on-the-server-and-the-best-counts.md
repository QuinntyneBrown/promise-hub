# 0055: Quiz attempts are per membership, autosaved, scored on the server at submit and then locked; the best scored attempt counts

- Status: accepted
- Date: 2026-10-27

## Context

Prompt 61 ports Waypoint's quiz taking (`L2-LEARN-004`, `L2-LEARN-005`) as `L2-075` and `L2-076`. In Waypoint a `QuizAttempt` keeps the youth's answers as one JSON string with the current question index, is submitted once with the answers in the body, is scored on the server, and always waits for a mentor's approval before the youth sees a score; its spec left open whether the best attempt or the best passing attempt counts. PromiseHub keeps youth progress per membership and gates it on the server (ADR 0051), and quizzes carry their rules (ADR 0054) but no approval rule.

## Decision

- **Attempt.** `QuizAttempt` (`PromiseHub.Domain/Learning/`) belongs to the organization, one youth membership and one quiz, numbered from 1. At most one attempt per membership and quiz is in progress; starting while one is in progress answers it again.
- **Order.** The attempt fixes its question order when it starts (`QuestionOrder`, comma-separated ids): the authored order, or a shuffle seeded by the attempt when the quiz shuffles. Questions added later are appended; deleted ones drop out.
- **Answers.** Stored as JSON text keyed by question id (`{"id": {"choices": [1]}}` or `{"text": "others"}`) with the current position. Every change is saved with `PUT /learning/attempts/{id}/answers`, validated against the quiz's questions; autosaves are not audited. Correct answers never leave the server before an attempt is submitted.
- **Submit.** `POST /learning/attempts/{id}/submit` carries the final answers, scores them against the stored correct answers (multiple answer only with exactly the correct options, short answer ignoring capitals and surrounding spaces, blank is wrong), stores the correct count, total, rounded percentage and passed, and is audited with the new `AuditAction.Submitted`. A submitted attempt never changes: saving or submitting again answers 409 `submitted`.
- **Limit and best score.** Starting past `AttemptsAllowed` answers 409 `no-attempts`; null is unlimited. The recorded score is the best scored attempt (Waypoint's open question): a later, lower attempt never lowers it.
- **Approval.** `Quiz.RequireApproval` (default false) puts a submitted attempt in `AwaitingApproval`: the youth sees no score or review, and it counts for nothing until a mentor approves it. The builder switch and the approval itself are prompt 63.
- **Feedback.** `ShowAnswers` reviews every attempt; `ScoreOnly` never; `AfterLastAttempt` once no attempt is left, never with unlimited attempts.
- **Locks and completion.** A whole-module quiz unlocks when the module is unlocked and its published lessons are done; a lesson quiz when its lesson is done. A module with a published required quiz is complete only once that quiz's best score passes, which also gates modules that need it.

## Consequences

- Prompt 63 adds the approval switch, the mentor's approve and override, and makes approved attempts count; prompt 64 awards badges on a pass.
- The module's done state now depends on quiz attempts as well as lesson progress; `LearnerProgress` loads both.
