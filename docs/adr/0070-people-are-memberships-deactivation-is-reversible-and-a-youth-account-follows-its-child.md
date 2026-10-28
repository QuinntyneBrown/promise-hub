# 0070: People are memberships, deactivation is reversible, and a youth account follows its child

- Status: accepted
- Date: 2026-10-28

## Context

Prompt 76 ports Waypoint's people directory, person record and account lifecycle (`L2-ADMIN-001`, `L2-ADMIN-002`, `L2-AUTH-009`) as `L2-112` to `L2-114`. Waypoint keeps one `User` per person with a status (Active, Deactivated, Removed), a cohort and a mentor, and revokes refresh tokens on deactivation and role change. PromiseHub has no user status: a person is a `StaffUser` (credentials, not tenant-owned) with one `Membership` per organization (role, removal, the youth's child), and every request reads the membership afresh (ADR 0005). Staff and roles (prompt 29) already invites, changes roles and removes access, and removal is permanent.

## Decision

- **A person in the directory is a membership.** `GET /people` lists the active organization's memberships that are not removed, with server-side search (name or email), role, status and program filters, 25 to a page. Priya, who belongs to two organizations, is a row in each. Guardians have no accounts (L1-013) and are not listed.
- **Deactivation is a membership state, reversible.** `Membership.DeactivatedAt` and `DeactivatedBy` mark it; `POST /people/{id}/deactivate` and `/reactivate` set and clear them, idempotently, audited as the new `Deactivated` and `Reactivated` actions. Removal stays on Staff and roles and stays permanent.
- **Sessions end on the next request.** A deactivated membership is treated like a removed one everywhere a session starts or continues: `ActiveMembership` and sign-in skip it, the organization switcher hides it, and `TenantContextMiddleware` moves a session in it to the person's next organization or answers 401 `account-deactivated` (L2-050). No token outlives a request, so nothing else needs revoking. Lists that name people for other features (mentor pickers, recipients) are unchanged; a deactivated person cannot sign in to read anything.
- **A youth account follows its child record.** Deleting a household (by an admin or a guardian's request) deactivates the youth accounts linked to its children, audited; reactivating one whose child record is deleted answers 422. A youth account's role cannot be changed, and nobody is changed to Youth; youth are invited from their child record (ADR 0045).
- **Role changes stay on `PUT /staff/{id}/role`.** It gains the participant roles (Mentor only while Mentoring is on, Volunteer) and the youth rules above; the change-role dialog warns when a participant moves to a staff role, since staff roles read every family's records.
- **Module fields are absent, not hidden.** A row's `mentoring` and a record's `mentoring` and `learning` objects are omitted from the JSON while their module is off; `role=Mentor` is refused while Mentoring is off.
- **The record's history is the audit log.** `GET /people/{id}` answers the ten newest audit entries whose record is the membership.
- **The directory lives at `/people`** in the administration library, linked from the More menu for admins only; it is always on (no module).
- **Deferred.** Editing a profile from the record, staff notes on the record, sending a password reset from the record (prompt 77), Waypoint's per-cohort role scope and pairing screen (mentor assignment exists in Mentoring), the youth's consent summary on the record, export of the directory, and "last active" beyond the last successful sign-in.

## Consequences

- One migration adds two nullable columns to `Memberships`.
- Every query that decides whether a session may start or continue checks `DeactivatedAt` beside `RemovedAt`.
- `PhPagination` joins the components library and replaces the audit log's hand-built pager.
