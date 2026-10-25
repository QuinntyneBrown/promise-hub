# 0010: Quick Cards in the attendance library, every open audited

- Status: accepted
- Date: 2026-10-25

## Context

`L2-019` asks for the allergy alert first, role-restricted medical fields and an audit entry for every open. The design places the page in the `attendance` library, while `AGENTS.md` maps each feature library to one module; it also left open whether a cache fill counts as a view.

## Decision

- **Library.** The Quick Card page lives in `attendance` beside check-in, its natural entry point. The library exports a second route set, `quickCardRoutes`, which the app mounts at `/quick-cards` with `moduleRoute(..., 'QuickCards', ...)`. Each route set maps to exactly one module, so nothing of Quick Cards loads while that module is off.
- **Endpoint.** `GET /children/{id}/quick-card` declares the Quick Cards module and answers `Cache-Control: private, no-store`.
- **Access.** Medical fields, the health card and the allergy alert are omitted for roles without `ReadMedical` (volunteer coordinators and youth workers). Who to call, approved pickups and notes stay visible to every staff role.
- **Audit.** Every open writes one `Viewed` entry with record type `QuickCard`, for every role, noting whether medical details were included. The cache fill for offline check-in (slice 25) will record its own action.
- **Content.** The alert's title is the allergy and its instruction comes from medical details (`AlertInstruction`, edited in Edit medical). The health card is stored masked (province and last four digits). Approved pickups are the household's guardians allowed to pick up until approved adults arrive (slice 26).

## Consequences

The Quick Card list for today's sessions and the offline copy arrive with offline check-in.
