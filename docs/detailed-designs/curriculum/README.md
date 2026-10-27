# Curriculum

The authoring side of the **Learning** module (ADR 0043, `L1-023`): tracks, modules, lessons, quizzes, assignments, badges and the progression framework, served by `backend/src/PromiseHub.Application/Curriculum/` and the `frontend/projects/curriculum/` library. Only admins and program directors author (`AuthorCurriculum`). The library maps to the Learning module; while it is off `/curriculum` redirects to Today and the endpoints answer 404.

Prompt 49 built the foundation ([open-curriculum](open-curriculum/README.md)): the gate and the author-only permission. Prompt 56 replaced the placeholder with tracks, modules, lessons and lesson video (ADR 0050); prompt 60 added quizzes and assignments (ADR 0054); prompt 64 added badges and the progression framework (ADR 0058). The designs:

| Design | Prompt | Waypoint source |
|---|---|---|
| [author-tracks-and-modules](author-tracks-and-modules/README.md) | 56 Author curriculum (built) | `curriculum-authoring/author-tracks-and-modules`, L2-CURRIC-001 |
| [author-lessons](author-lessons/README.md) | 56 Author curriculum (built) | `curriculum-authoring/author-lessons`, L2-CURRIC-002 |
| [upload-lesson-video](upload-lesson-video/README.md) | 56 Author curriculum (built) | `curriculum-authoring/upload-lesson-video`, L2-CURRIC-002 |
| [author-quizzes](author-quizzes/README.md) | 60 Author quizzes and assignments | `curriculum-authoring/author-quizzes`, L2-CURRIC-003 |
| [author-assignments](author-assignments/README.md) | 60 Author quizzes and assignments | `curriculum-authoring/author-assignments`, L2-CURRIC-004 |
| [author-badges](author-badges/README.md) | 64 Author badges and progression | `curriculum-authoring/author-badges`, L2-CURRIC-005 |
| [award-badges](award-badges/README.md) | 64 Author badges and progression | `curriculum-authoring/award-badges`, L2-CURRIC-005 |
| [author-progression-framework](author-progression-framework/README.md) | 64 Author badges and progression | `curriculum-authoring/author-progression-framework`, L2-CURRIC-006 |
