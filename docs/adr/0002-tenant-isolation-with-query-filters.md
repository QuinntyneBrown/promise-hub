# 0002: Tenant isolation with a global query filter and a save guard

- Status: accepted
- Date: 2026-10-25

## Context

`L2-001` requires every query to filter by the organization of the active membership, never by a client value.

## Decision

- Every tenant-owned entity implements `ITenantOwned`. `PromiseHubDbContext` applies a query filter `OrganizationId == ITenantContext.OrganizationId` to each of them; an unresolved tenant matches nothing.
- `SaveChanges` refuses an added, changed or deleted tenant-owned row whose organization differs from the tenant. Only the CLI seeder runs as the system tenant.
- `TenantContextMiddleware` resolves the tenant from the session's `membership_id` claim and answers 401 when the membership does not exist. No request value is ever read for the tenant.
- A lookup by id that the filter hides answers 404; when the row exists in another organization the handler writes an `AccessDenied` audit entry.

## Consequences

Cross-tenant reads are impossible without `IgnoreQueryFilters()`, which is reserved for the seeder, membership resolution, the cross-tenant check and the platform-admin screens.
