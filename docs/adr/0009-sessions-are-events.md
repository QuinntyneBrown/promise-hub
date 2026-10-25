# 0009: A session is an event; idempotent attendance

- Status: accepted
- Date: 2026-10-25

## Context

The check-in design introduces a `Session` entity beside `Event`. Every session in the mocks is one event of a program (Tutoring night, Saturday Sports), and the API must survive a repeated tap from a phone with a poor connection.

## Decision

- **A session is an event.** `/sessions/{id}` takes an event id; there is no separate `Session` table. The session's expected roster is its program's active enrollments plus its walk-ins.
- **Today** is the organization's local date: `Organization.TimeZone` (IANA, `America/Toronto` for the seed) decides which events are today's.
- **Attendance** is one `AttendanceRecord` per child (or walk-in) per event, the current view, plus an append-only `AttendanceEvent` per change. A unique (`OrganizationId`, `ClientActionId`) index makes a repeated tap a no-op that still answers 200.
- **Optimistic UI.** The check-in page changes the row and totals before the server answers and reverts with a named toast on failure.
- **Walk-ins** are `WalkIn` rows on one event, checked in at once and flagged for follow-up.
- **Deferred:** the absence text to the guardian (Messages), sign-out (slice 08), the sync chip and offline queue (slice 25), session notes and End session (slice 24).

## Consequences

A recurring program needs one event per session; generating them from a schedule arrives with onboarding or a later program slice.
