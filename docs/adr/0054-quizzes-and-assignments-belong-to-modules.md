# 0054: Quizzes and assignments belong to a module, are attached to the module or one of its lessons, and keep their answers and rubric with them

- Status: accepted
- Date: 2026-10-27

## Context

Prompt 60 ports Waypoint's quiz and assignment authoring (`L2-CURRIC-003`, `L2-CURRIC-004`) as `L2-073` and `L2-074`. In Waypoint a quiz or assignment points at a module or a lesson (both optional), stores options and correct answers as JSON, keeps settings in loose strings, and publishing an assignment writes an `AssignedWork` row per youth of the cohorts whose track holds the module. PromiseHub has tracks, modules and lessons (ADR 0050), visibility to youth through published content of a followed track (ADR 0051), plain handlers returning `Result`, and tenant-filtered tables.

## Decision

- **Ownership.** `Quiz` and `Assignment` always belong to one `CurriculumModule` (`ModuleId`, required) and are attached to the whole module (`LessonId` null) or to one live lesson of that module. Moving one to another module is not offered. Deleting a lesson moves its quizzes and assignments to the whole module.
- **Questions.** `QuizQuestion` rows (quiz, position, text, `QuestionType`) keep options and accepted answers as newline-separated text and correct options as comma-separated indexes, like lesson objectives. True / false always stores the options True and False. Questions are added, edited and deleted one at a time through their own endpoints and reordered as a whole list, as lessons are.
- **Settings.** Pass mark 1 to 100, attempts 1 to 10 or null for unlimited, `FeedbackMode` (`ShowAnswers`, `ScoreOnly`, `AfterLastAttempt`), shuffle and required-to-complete live on `Quiz`. New quizzes default to 70%, 2 attempts and `ShowAnswers`, as in Waypoint.
- **Rubric.** `RubricCriterion` rows are saved with the assignment: `PUT /curriculum/assignments/{id}` replaces the whole rubric, and the server stores `TotalPoints`. The builder edits criteria in a dialog and sends them only with Save assignment.
- **Due rules.** `DueDate` is a date without time (`DateOnly`), `GraceDays` 0 to 14, plus `AllowLate` and `RequireApproval`. `SubmissionTypes` is a flags enum (Text, Photo, Link, File).
- **Status.** Draft or Published through the shared status dialog. Publishing a quiz needs a question; an assignment needs a task and a criterion. Published content reaches youth under ADR 0050's rule; "published to cohorts" means exactly that, and no per-youth assigned-work rows are written here (prompt 69 adds assigned work).
- **Privacy.** Correct answers and rubrics are returned only by `/curriculum` endpoints (`AuthorCurriculum`); youth read models arrive with prompts 61 and 62 and must never include correct answers before an attempt is submitted.
- **Audit.** Created, Updated (before and after) and Deleted on `Quiz`, `QuizQuestion` and `Assignment`.

## Consequences

- Prompt 61 scores attempts against `QuizQuestion` answers and the quiz rules and records the best attempt within the limit; prompt 62 accepts submissions of the configured types; prompt 63 grades against the rubric.
- Editing a published quiz or an assignment with submissions is allowed until those prompts add locks.
- Deleting a whole quiz or assignment is deferred; a draft can be left unpublished.
