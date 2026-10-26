# 0026: Youth workers read only the children of their sessions, and see age rather than date of birth

- Status: accepted
- Date: 2026-10-25

## Context

Prompt 32 asks that a youth worker see only authorized roster fields and that restricted records are never sent (`L2-007`, `L2-032`). Medical fields were already withheld from youth workers and volunteer coordinators (`ReadMedical`), and youth workers already run only the sessions they are assigned to (ADR 0012).

## Decision

- **Row scope.** `RosterAccess` gives a youth worker (the roles `SessionAccess` scopes) the children actively enrolled in a program with a session they are assigned to. `GET /children/{id}` and `GET /households/{id}` answer 403 for anything else and write an `AccessDenied` audit entry; a household lists only the permitted children. Families and child search leave restricted children and households out entirely. Everyone else reads the whole roster.
- **Field policy.** A new `ReadDateOfBirth` permission (admins, directors, site leads) gates the date of birth; others get the age only. Guardian phone and email stay visible, as the household mock's volunteer state shows: a youth worker may need to call a guardian at pickup.
- **Order.** Another organization's child answers 404 before the role check, so a 403 never confirms a record exists elsewhere.
- **Frontend.** The child and household pages show a lock page ("This child isn’t in your sessions", mock `child/outside-sessions`) for 403.

## Consequences

A youth worker with no assignment sees an empty Families list. Programs, Quick Cards and rosters are unchanged; they were already scoped by session.
