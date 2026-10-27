# Learning

Handlers and DTOs for the Learning module's youth side (ADR 0043, L1-023): the youth's own record, guardian-consent and placement gates, first-run setup, and completing lessons (prompt 57, ADR 0051): `LearnerProgress` decides what a youth may see and open, and the home, track, module, lesson, video, coding and project handlers project it. Taking quizzes (prompt 61, ADR 0055): `QuizIntroHandler`, `QuizAttemptCommand` (start, autosave, submit) scored by `QuizScoring`, and `QuizResultHandler`. Assignments, reflections, journey and badges arrive with the journeys of prompts 62 to 66.
