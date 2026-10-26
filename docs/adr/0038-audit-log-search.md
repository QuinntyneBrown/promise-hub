# 0038: The audit log is searched in the tenant's entries on request and exported as CSV, logging the export

- Status: accepted
- Date: 2026-10-26

## Context

Prompt 44 asks an admin to search sensitive actions by person, record and time and export them (`L2-032`). Every sensitive action already writes an `AuditEntry` (ADR 0004).

## Decision

- **Search.** `GET /audit` (new `ViewAudit`, admins only) filters the tenant's entries by the last N days (default 7), an action, and text matched against the actor, record type and summary; newest first, 50 a page with the total.
- **Export.** `GET /audit/export` returns the same filter as CSV and records an `Exported` entry for the audit log itself.
- **Frontend.** `AUDIT_API`; `AuditLogPage` in the `administration` library at `/settings/audit`, with search, action and period filters, paging and an Export link that carries the filters.

## Consequences

Filtering runs in memory over the tenant's entries, which is fine at current volumes; an index on `(OrganizationId, OccurredAt)` and server-side paging can follow. Device and location are shown only when recorded.
