# 0007: Soft delete, command results and client-side permission hints

- Status: accepted
- Date: 2026-10-25

## Context

Households are deleted softly and purged later (`L2-011` criterion 5); the default retention for an admin-initiated delete was open. Write endpoints need one way to report validation errors, and pages need to hide actions a role lacks.

## Decision

- **Soft delete.** Entities that implement `ISoftDeletable` get `DeletedAt == null` added to the tenant query filter, so a deleted household, its guardians and its children leave every query. `Household.SoftDelete` sets `PurgeAfter` 30 days later (the mock's "Deleted in 30 days"). The purge job arrives with `run-background-jobs`.
- **Command results.** Handlers return `Result` (done, created with an id, not found, or invalid with one message per field). `ResultExtensions.ToHttp` maps it to 204, 201, 404 or 422 `{ errors: { field: message } }`, and the web app maps those to `WriteOutcome`.
- **Permission hints.** `can(role, permission)` in the API client mirrors `RolePermissions` so pages hide what a role cannot do. The server still checks every request.
- **Families search** runs over the organization's households in memory; a database search index arrives with `search-records`.

## Consequences

A change to `RolePermissions` must change `can` in the same commit.
