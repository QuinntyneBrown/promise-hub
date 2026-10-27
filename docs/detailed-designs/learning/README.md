# Learning

The youth side of the **Learning** module (ADR 0043, `L1-023`): lessons, quizzes, assignments, reflections, the journey and badges, served by `backend/src/PromiseHub.Application/Learning/` and the `frontend/projects/learning/` library. The module needs Roster; while it is off every endpoint answers 404 and `/learning` redirects to Today.

Prompt 49 built the foundation only ([read-own-record](read-own-record/README.md)): `GET /learning/me` (a youth's own linked child record, `L2-007` criterion 9, `L2-045`) and the placeholder `LearningPage` (`learning`, now `learn-home`). The journey prompts add these designs:

| Design | Prompt | Waypoint source |
|---|---|---|
| [`obtain-required-consent`](obtain-required-consent/README.md) | 52 Give guardian consent | `platform-services` L2-PLATFORM-011 |
| [`onboard-youth`](onboard-youth/README.md) | 53 Complete first-run onboarding | `authentication` L2-AUTH-011 |
| [`await-cohort-placement`](await-cohort-placement/README.md) | 53 Complete first-run onboarding | `platform-services` L2-PLATFORM-011 |
| [`browse-curriculum`](browse-curriculum/README.md) | 57 Complete lessons | `learning-experience` L2-LEARN-001 |
| [`complete-lessons`](complete-lessons/README.md) | 57 Complete lessons | `learning-experience` L2-LEARN-002 |
| [`stream-lesson-video`](stream-lesson-video/README.md) | 57 Complete lessons | `learning-experience` L2-LEARN-002 (stream-lesson-video) |
| [`complete-coding-lessons`](complete-coding-lessons/README.md) | 57 Complete lessons | `learning-experience` L2-LEARN-008 |
| [`submit-coding-projects`](submit-coding-projects/README.md) | 57 Complete lessons | `learning-experience` L2-LEARN-008 |
| [`take-quizzes`](take-quizzes/README.md) | 61 Take quizzes | `learning-experience` L2-LEARN-004 |
| [`review-quiz-results`](review-quiz-results/README.md) | 61 Take quizzes | `learning-experience` L2-LEARN-005 |
| `submit-assignments` | 62 Submit assignments | L1-LEARN-005 |
| `view-journey-and-progress` | 65 View journey and progress | L1-LEARN-007, 008 |
| `write-reflections` | 66 Write reflections | L1-LEARN-006 |
