# 0021: Incidents are reported by any staff member and read by supervisors and the reporter only

- Status: accepted
- Date: 2026-10-25

## Context

Prompt 19 lets a site lead record an incident and submit it for supervisor review (`L2-023`). The design left open who counts as a supervisor and whether a site lead reads incidents from sessions they led.

## Decision

- **Supervisors.** Admins and program directors read the whole log; the new-incident form names the first program director as the person it goes to, and every program director is emailed at once. Everyone else, including site leads, reads only the incidents they reported; any other incident answers 404, not 403, so its existence is not disclosed.
- **Report.** `POST /incidents` takes the structured form: type, one child of the organization, when, where, what happened, what was done, guardian contact and severity. Each missing fact is named and nothing is saved. A complete report is `NeedsReview` and is audited as created.
- **Reads.** `GET /incidents` returns `canReadLog` and the readable incidents; `GET /incidents/{id}` audits every view; `GET /incidents/form` gives the children and the supervisor. All of it needs the Incident log module.
- **Pages.** `IncidentsPage`, `NewIncidentPage` and `IncidentPage` in the `incidents` library, composed from existing library components.

## Consequences

Review, notes and reopening are prompt 20. Several children on one report, restricted names, saving a draft on the server and in-app notifications come later.
