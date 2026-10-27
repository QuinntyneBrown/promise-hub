# 0049: One mentor scope serves every Mentoring read, and a mentor reads a mentor-safe youth record

- Status: accepted
- Date: 2026-10-26

## Context

Prompt 55 ports Waypoint's mentor dashboard, roster, youth detail and group pages (`L2-MENTOR-001`, `L2-MENTOR-002`, `L2-AUTH-010`) as `L2-063` to `L2-065`. Waypoint scopes each query with `User.MentorId` and lets a program administrator use the mentor pages too; its youth detail returns the guardian's contact, progress, attendance, check-ins, submissions and competencies. PromiseHub already decided who a mentor's youth are (ADR 0048), keeps medical fields and dates of birth away from roles that do not need them (L2-007, L2-019), and has no lessons, grading, check-ins or flags yet.

## Decision

- **Mentor scope.** `MentorScope` in `PromiseHub.Application/Mentoring/` is the single query for the caller's youth (direct `YouthMentor` rows plus the active rosters of non-archived programs whose team includes the caller) and cohorts. `GET /mentoring/youth`, `GET /mentoring/dashboard`, `GET /mentoring/youth/{childId}` and `GET /mentoring/cohorts/{programId}` all use it.
- **Mentors only.** All four endpoints carry `RequireModule(Mentoring)` and `RequirePermission(MentorYouth)`. Staff keep reading children through Families and cohorts through Programs; the mentor pages are not opened to program directors as Waypoint's were.
- **Mentor-safe record.** The youth record is a separate contract built field by field: name, goes-by name and pronouns (from a completed `YouthOnboarding` of a youth membership linked to the child), age (never the date of birth), school, active programs, the youth's mentor, the household's guardians (name, relationship, mobile, email, primary first) and, while Roll Call is on, the ten latest attendance records. Medical fields, the health card, staff notes and approved pickups are never copied.
- **Refusals.** A child or program of the caller's organization outside the scope answers 403 and is audited as `AccessDenied` (on `Child` or `Program`); another organization's or an unknown id answers 404 through the tenant filter. An archived cohort is outside the scope. Each successful record open is audited as `Viewed` on `Child`, like a Quick Card open.
- **Activity.** "Recent activity" and "Checked in this week" are read from Roll Call's attendance records and are null while Roll Call is off, so nothing about check-in renders.
- **Routes.** The `mentoring` library serves `/mentoring` (dashboard, replacing the placeholder list), `/mentoring/youth`, `/mentoring/youth/:childId` and `/mentoring/cohorts/:programId`; the mock `mentoring` becomes `mentor-dashboard`.

## Consequences

- Grading, check-ins, at-risk flags and progress (prompts 57, 63, 67, 68) add their sections to the dashboard and the record and must ask `MentorScope`, not write their own query.
- Waypoint's roster export and status filters wait for flags (prompt 68).
- A mentor sees guardian contacts; that is the reason the record open is audited.
