# Curriculum

The authoring side of the **Learning** module (ADR 0043, `L1-023`): tracks, modules, lessons, quizzes, assignments, badges and the progression framework, served by `backend/src/PromiseHub.Application/Curriculum/` and the `frontend/projects/curriculum/` library. Only admins and program directors author (`AuthorCurriculum`). The library maps to the Learning module; while it is off `/curriculum` redirects to Today and the endpoints answer 404.

Prompt 49 built the foundation only ([open-curriculum](open-curriculum/README.md)): `GET /curriculum` (an empty track list, `L2-007` criterion 12) and the placeholder `CurriculumPage` (`curriculum`). The journey prompts add these designs:

| Design | Prompt | Waypoint source |
|---|---|---|
| `author-curriculum` | 56 Author curriculum | `curriculum-authoring` L1-CURRIC-001 |
| `author-quizzes-and-assignments` | 60 Author quizzes and assignments | L1-CURRIC-002, 003 |
| `author-badges-and-progression` | 64 Author badges and progression | L1-CURRIC-004, 005 |
