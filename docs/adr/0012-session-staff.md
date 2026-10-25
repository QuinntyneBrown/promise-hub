# 0012: Staff are assigned per session; youth workers run only their own

- Status: accepted
- Date: 2026-10-25

## Context

A youth worker may check children in and out only for the sessions they work (journey "Record attendance"). Nothing recorded who works a session; the event page mock lists its staff ("Jaylen Okafor (lead), Aisha Bello, 4 volunteers").

## Decision

- **Model.** `SessionStaff` links a session (an event, ADR 0009) to a membership, one row per person, tenant-owned. Assigning per session matches the event page and lets a youth worker cover one night without the whole program.
- **Rule.** A new permission, `RunAnySession`, is held by admins, program directors and site leads. A role that runs sessions without it (youth worker) is scoped: `SessionAccess` limits Today to its assigned sessions and answers 403 for the roster and every attendance write (check-in, absence, walk-in, sign-out) of any other session. The order is fixed: another organization's session is 404 first, then 403, so the answer never reveals another tenant. Volunteer coordinators keep read-only access to every roster.
- **Results.** Commands gain `ResultStatus.Forbidden`, written as 403 with the same `{ code: "forbidden" }` problem body as the permission policy.
- **Frontend.** The check-in page shows "You’re not on this session" (the `forbidden` error-page pattern) when the roster answers 403.

## Consequences

Assigning staff to sessions is seeded for now (Jaylen and Aisha on tonight's Tutoring night). Managing assignments arrives with the staff and event editing slices; until then a youth worker without an assignment sees no sessions.
