# 0024: Approved pickups are their own rows beside the guardians, changed from the Quick Card and the family page

- Status: accepted
- Date: 2026-10-25

## Context

Prompt 26 lets guardians and staff add or remove the adults authorized to collect a child (`L2-020`). Until now the approved list was the household's guardians who may pick up.

## Decision

- **Data.** `ApprovedPickup` holds an adult besides the guardians for one child: name, relationship, optional mobile, who added it (staff or guardian) and when. Removal sets `RemovedAt`/`RemovedBy` and keeps the row. The sign-out options and the Quick Card list the guardians who may pick up first, then the active approved adults.
- **Staff.** `POST /children/{id}/pickups` (optionally for all the family's children) and `DELETE /children/{id}/pickups/{pickupId}` need the new `ManagePickups` permission (site leads, directors, admins) and the Pickup module. A staff removal texts the household through the message path (`MessageSource.Pickup`). Every change is audited.
- **Guardians.** The family page (`/g/home/:token`, ADR 0020) lists each child's approved adults and adds or removes them through `/g/home/{token}/children/{childId}/pickups` after the code check, limited to the household's own children.
- **Screens.** Staff manage the list from the Quick Card (the `attendance` library, which owns Pickup) with `AddPickupDialog` and `RemovePickupDialog`; guardians use `GuardianPickupDialog` in the `guardian` library. The household page in the `households` library is unchanged, since a feature library maps to one module.

## Consequences

Photo ID on file, refusing and reporting at sign-out, and the household page's staff view are later. Texts are in English until messages are translated.
