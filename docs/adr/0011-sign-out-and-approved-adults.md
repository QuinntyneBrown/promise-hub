# 0011: Sign-out checks the approved list; anyone else needs the guardian's okay

- Status: accepted
- Date: 2026-10-25

## Context

`L2-017` criterion 3 and `L2-020` ask that a child leaves only with an approved adult, or with someone else the family okayed, and that the attendance record keeps who collected them. Approved adults as their own records (`add-pickup`, `remove-pickup`) are slice 26, and Messages and the incident log are not built yet.

## Decision

- **Approved adults.** Until slice 26, a child's approved adults are the household's guardians allowed to pick up (`CanPickUp`), the same list the Quick Card shows. `GET /children/{id}/pickups` returns them, primary first, with the primary guardian's name and number.
- **Sign-out.** `POST /sessions/{id}/sign-outs` takes either a guardian id or `someoneElse` with a name and `guardianConfirmed`, plus `idChecked`. A guardian id that is not on the child's list is refused with whom to call; someone else without the okay by phone is refused too. Only a checked-in child can be signed out. The record keeps `SignedOutAt`, `CollectedBy`, `CollectorGuardianId`, `ConfirmedByPhone` and `IdChecked`, appends a `SignedOut` attendance event and writes an audit entry. A repeated client action id changes nothing, as for check-in (ADR 0009).
- **Module and roles.** Both endpoints declare the Pickup module, and sign-out needs `RunSessions`. Pickup needs Roll Call, so the sign-out route also sits behind Roll Call.
- **Frontend.** Sign out is a button on checked-in roster rows while Pickup is on, opening `SignOutDialog` (CDK). Pickup has no page of its own, so there is no route to redirect; when the module is off the button is not rendered.

## Consequences

Telling the household about a someone-else pickup arrives with Messages, and reporting a refused adult with the incident log. Approved adults who are not guardians arrive with slice 26 and join the same list.
