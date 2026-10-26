# 0027: Today is one summary endpoint composed on the server from the modules that are on

- Status: accepted
- Date: 2026-10-25

## Context

Prompt 33 asks that Today show sessions, missing slips, alerts and tasks in one place, composed only from modules that are on (`L2-005`, `L2-038`). Today already listed tonight's sessions from `GET /sessions/today` (Roll Call). The repository layout has no `Today` feature folder in the backend.

## Decision

- **One endpoint.** `GET /today` (Roster) returns the active-children and household counts, slips still collecting signatures (null when Slips is off), the events of the next 14 days, and the tasks waiting: incidents to review (Incidents on, `ReviewIncidents`), enrollments to review (`ReviewEnrollments`) and pending pickup requests (Pickup on, `ManagePickups`). Counts of zero are left out. Sessions stay on `GET /sessions/today`.
- **Where.** `TodayHandler` lives in `Application/Reports/`, the feature that owns summaries, and the endpoint in `Api/Endpoints/TodayEndpoints.cs`.
- **Frontend.** `TODAY_API` in the `api` library; the `today` library composes `ph-stat`, `ph-card`, `ph-list` and the new `ph-skeleton` (added to the components library from the design system). A count links to its screen only when that screen's module is on.

## Consequences

Today makes two requests (sessions and summary). Recent activity from the mock waits for the audit log (prompt 44).
