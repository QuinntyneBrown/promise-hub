# 0025: Staff access is a membership read on every request; invitations are hashed links by email

- Status: accepted
- Date: 2026-10-25

## Context

Prompt 29 lets an admin invite staff, assign roles and remove access (`L2-007`, `L2-009`). Sessions are cookies carrying the membership id; every request already loads that membership to resolve the tenant.

## Decision

- **Who.** Only admins manage staff (`ManageStaff`). Staff access is part of every organization, not a module. The page lives in the `administration` library at `/settings/staff`, as the mock's route says.
- **Invite.** `POST /staff/invitations` takes a work email and a role, stores a `StaffInvitation` with only the token's hash, a 14-day expiry and who invited, and emails a link to `/invite/<token>`. A person who already has access, or an invitation already waiting for the email, is refused. `DELETE /staff/invitations/{id}` withdraws one. Accepting is prompt 30.
- **Roles and removal.** `PUT /staff/{id}/role` changes the role, which applies on the person's next request because the role is read from the membership each time. `DELETE /staff/{id}` sets `Membership.RemovedAt`; the tenant middleware and sign-in ignore removed memberships, so the person's next request answers 401 and their records keep naming them. Admins cannot change or remove themselves, which also keeps at least one admin. Every change is audited.

- **Accepting (prompt 30).** `GET /invitations/{token}` shows the invitation or answers 410 with who invited; `POST /invitations/{token}/accept` (anonymous) creates the `StaffUser` (or checks the existing one's password) and a `Membership` in the invitation's organization, marks it accepted and signs in. `PUT /me/phone` saves the worker's mobile on the membership, never shown to guardians. The account library mounts the pages at `/invite/:token` and `/welcome/phone`, `/welcome/ready`. Choosing programs to cache (`onboard-staff-sessions`) is left for later; the ready step shows today's assigned sessions.

- **Coverage (prompt 31).** `GET /coverage` (new `AssignStaff`: admins, directors, site leads, coordinators) lists the next 14 days of sessions with their staff and gaps; `PUT /sessions/{id}/staff` replaces the session's `SessionStaff` rows (ADR 0012) and is audited; `GET /coverage/mine` lists one's own. Inviting needs the new `InviteStaff` (admins and coordinators); a coordinator may invite youth workers only. The page is `CoveragePage` at `/settings/coverage` in the `administration` library.

## Consequences

A removed person's open browser tab fails on its next request rather than being pushed out at once.
