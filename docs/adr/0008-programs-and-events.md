# 0008: Programs and events as roster data, in-process draft slips

- Status: accepted
- Date: 2026-10-25

## Context

Programs and events are not a switchable module, yet check-in (Roll Call) and slips both hang off them, and ADR 0006 shows the Programs and Events sections only while Permission slips is on. The designs left open the program name length, whether archiving cancels future events, and how a draft slip is created when an event needs one.

## Decision

- **Gate.** The `/programs`, `/events` and `/children` endpoints declare the Roster module: every module reads them, so a check-in-only organization still has sessions. The Programs and Events pages follow Permission slips in navigation (ADR 0006); check-in-only organizations set up their sessions during onboarding.
- **Draft slip.** `CreateEventHandler` adds the `PermissionSlip` draft in the same unit of work as the event. There is no domain-event dispatcher yet; one arrives when a second consumer needs it.
- **Archiving** closes enrollment and keeps the roster, events and attendance; it does not cancel future events. Archived programs leave lists and pickers and cannot take new events or enrollments.
- **Removing from a roster** ends the enrollment (`EndedAt`, reason) so attendance stays in reports.
- **Names** are at most 120 characters.
- **Cancelling** records who, when, the message and whether guardians are to be told. Sending that message arrives with Messages (slice 10); deleting an event entirely is deferred.

## Consequences

Roll Call and Slips read programs and events without depending on each other. When Messages lands, cancellation dispatches the stored message.
