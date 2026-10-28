# Mentoring

Domain types for the Mentoring module: mentor assignments, mentor check-ins, at-risk flags and grading (ADR 0043, L1-024).

- `YouthMentor` — the one mentor a child has in an organization (prompt 54, ADR 0048).
- `CohortMentor` — a mentor on a program's team, lead or supporting (prompt 54, ADR 0048).

- `Competency`, `CompetencyAssessment`, `CompetencyLevel` — competencies a mentor assesses (prompt 63, ADR 0057).
- `MentorCheckIn`, `MentorCheckInKind`, `MentorCheckInEngagement` — a mentor's record of one conversation with a youth, read only by its author (prompt 67, ADR 0061).

- `AtRiskFlag`, `AtRiskFlagSeverity`, `AtRiskFlagOutcome` — a mentor's worry about one of his youth, open until a mentor of the youth, an admin or a program director resolves it with an outcome (prompt 68, ADR 0062).
