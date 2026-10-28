# Mentoring

The **Mentoring** module (ADR 0043, `L1-024`): the mentor dashboard, youth records, grading, check-ins, at-risk flags and assigned work, served by `backend/src/PromiseHub.Application/Mentoring/` and the `frontend/projects/mentoring/` library. A mentor reaches only the youth assigned to them. The module needs Roster; grading and assign work also need Learning content and render only while Learning is on.

Prompt 49 built the foundation only ([list-assigned-youth](list-assigned-youth/README.md)): `GET /mentoring/youth` (the caller's assigned youth, `L2-007` criterion 10; prompt 54 fills it from mentor assignments, [assign-mentors](assign-mentors/README.md)) and the placeholder `MentoringPage` (`mentoring`), which prompt 55 replaces with the mentor dashboard (`mentor-dashboard`, ADR 0049). The journey prompts add these designs:

| Design | Prompt | Waypoint source |
|---|---|---|
| [`assign-mentors`](assign-mentors/README.md) | 54 Manage cohorts | `program-administration` L2-ADMIN-005 |
| [`manage-mentor-roster`](manage-mentor-roster/README.md) | 55 Use the mentor dashboard | `mentoring` L2-MENTOR-001 |
| [`view-youth-record`](view-youth-record/README.md) | 55 Use the mentor dashboard | `mentoring` L2-MENTOR-002 |
| [`scope-data-by-role`](../identity/scope-data-by-role/README.md) | 55 Use the mentor dashboard | `authentication` L2-AUTH-010 |
| [`grade-submissions`](grade-submissions/README.md) | 63 Grade and assess | `mentoring` L2-MENTOR-003 |
| [`approve-quiz-assessments`](approve-quiz-assessments/README.md) | 63 Grade and assess | `mentoring` L2-MENTOR-004 |
| [`assess-competencies`](assess-competencies/README.md) | 63 Grade and assess | `mentoring` L2-MENTOR-005 |
| [`protect-concurrent-updates`](../platform/protect-concurrent-updates/README.md) | 63 Grade and assess | `non-functional` L2-NFR-006 |
| [`record-mentor-check-ins`](record-mentor-check-ins/README.md) | 67 Record mentor check-ins | `mentoring` L2-MENTOR-006 |
| [`manage-at-risk-flags`](manage-at-risk-flags/README.md) | 68 Flag at-risk youth | `mentoring` L2-MENTOR-007 |
| `assign-work` | 69 Assign work | L1-MENTOR-008 |
