# 0041: Platform admins are a flag on the person; suspension is a timestamp enforced per request and per job

- Status: accepted
- Date: 2026-10-26

## Context

Prompt 47 lets platform admins list, add, suspend and reinstate organizations (`L2-003`). Tenancy comes from the signed-in membership (ADR on tenant context), and background sends run per tenant.

## Decision

- **Who.** `StaffUser.IsPlatformAdmin` marks a platform admin; it is not tenant-owned and not a role. `PlatformOrganizationsHandler` checks it on every call and answers 403 otherwise. The seed makes Tom a platform admin.
- **Endpoints.** `GET /platform/organizations` (`q`, `plan`, `status`), `POST /platform/organizations`, `POST /platform/organizations/{id}/suspend` (with a reason) and `/reinstate`.
- **Adding.** The organization is saved first; its module preset and first-admin `StaffInvitation` are written in its own scope, then the welcome email carries the invitation link. Status is derived: Suspended when `SuspendedAt` is set, Setting up until the profile is confirmed, otherwise Active.
- **Suspending.** `Organization.SuspendedAt` and `SuspensionReason`. `TenantContextMiddleware` answers 403 `{ code: "suspended" }` to the tenant's staff, except on `/platform`; guardian links stop resolving; `MessageDispatchRunner` skips the tenant. Nothing is deleted, and reinstating clears both fields.
- **Frontend.** `OrganizationsPage` at `/admin/organizations` in `administration`, with `AddOrganizationDialog` and `SuspendOrganizationDialog`; `PhTable` gains an optional `#rowActions` template. The auth guard sends a suspended person to sign in with `reason=suspended`.

## Consequences

Granting or removing platform admin is a database change for now; there is no screen for it.
