# Learning

The youth side of the **Learning** module (ADR 0043, `L1-023`): lessons, quizzes, assignments, reflections, the journey and badges, served by `backend/src/PromiseHub.Application/Learning/` and the `frontend/projects/learning/` library. The module needs Roster; while it is off every endpoint answers 404 and `/learning` redirects to Today.

Prompt 49 built the foundation only ([read-own-record](read-own-record/README.md)): `GET /learning/me` (a youth's own linked child record, `L2-007` criterion 9, `L2-045`) and the placeholder `LearningPage` (`learning`). The journey prompts add these designs:

| Design | Prompt | Waypoint source |
|---|---|---|
| `complete-lessons` | 57 Complete lessons | `learning-experience` L1-LEARN-001 to 003 |
| `take-quizzes` | 61 Take quizzes | L1-LEARN-004 |
| `submit-assignments` | 62 Submit assignments | L1-LEARN-005 |
| `view-journey-and-progress` | 65 View journey and progress | L1-LEARN-007, 008 |
| `write-reflections` | 66 Write reflections | L1-LEARN-006 |
