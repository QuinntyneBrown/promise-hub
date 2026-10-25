# 0003: Plain application handlers, no mediator library

- Status: accepted
- Date: 2026-10-25

## Context

Some designs mention MediatR pipeline behaviours (`NotFoundOnCrossTenantBehavior`, `ViewAuditBehaviour`).

## Decision

Application handlers are plain classes registered in `AddApplication()` and injected into minimal API endpoints. Cross-cutting rules that designs place in pipeline behaviours are implemented in the handler or in an EF Core interceptor.

## Consequences

Fewer moving parts and no licensed dependency. If many handlers repeat the same cross-cutting code, introduce a small decorator then, in a new ADR.
