# Mentoring

The **Mentoring** module (ADR 0043, `L1-024`): the mentor dashboard, youth records, grading, check-ins, at-risk flags and assigned work, served by `backend/src/PromiseHub.Application/Mentoring/` and the `frontend/projects/mentoring/` library. A mentor reaches only the youth assigned to them. The module needs Roster; grading and assign work also need Learning content and render only while Learning is on.

Prompt 49 built the foundation only ([list-assigned-youth](list-assigned-youth/README.md)): `GET /mentoring/youth` (the caller's assigned youth, `L2-007` criterion 10; prompt 54 fills it from mentor assignments, [assign-mentors](assign-mentors/README.md)) and the placeholder `MentoringPage` (`mentoring`). The journey prompts add these designs:

| Design | Prompt | Waypoint source |
|---|---|---|
| [`assign-mentors`](assign-mentors/README.md) | 54 Manage cohorts | `program-administration` L2-ADMIN-005 |
| `use-the-mentor-dashboard` | 55 Use the mentor dashboard | `mentoring` L1-MENTOR-001, 002 |
| `grade-and-assess` | 63 Grade and assess | L1-MENTOR-003 to 005 |
| `record-mentor-check-ins` | 67 Record mentor check-ins | L1-MENTOR-006 |
| `flag-at-risk-youth` | 68 Flag at-risk youth | L1-MENTOR-007 |
| `assign-work` | 69 Assign work | L1-MENTOR-008 |
