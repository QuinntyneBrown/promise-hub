# 0028: Global search is one roster-scoped endpoint, and its page lives in the households library

- Status: accepted
- Date: 2026-10-26

## Context

Prompt 34 asks staff to find permitted children, families and events by name or phone fragment across enabled modules (`L2-039`). The top bar already navigated to `/search`, which had no page. The repository layout has no search feature library, and the app holds no feature pages.

## Decision

- **Endpoint.** `GET /search?q=` (Roster) in `Application/Search/SearchHandler.cs` returns children, households and events, up to ten of each. Names and emails match case-insensitively anywhere; three or more digits match a guardian's mobile with punctuation ignored. Results respect `RosterAccess` (ADR 0026), so youth workers find only the children and families of their sessions. Events are null when Permission slips (which owns events) is off. Searching is not audited; opening a record is.
- **Page.** `SearchPage` lives in the `households` library, exported as `searchRoutes` and mounted at `/search` under Roster, because search reads the roster and each library maps to one module.
- **Simple matching.** In-memory filtering over the tenant's rows replaces the normalized search columns the design proposed; the phase 1 roster sizes keep it well within the 300 ms budget.

## Consequences

Recent items (`search/empty`) are not built yet; the empty state asks for a name, phone or email. Normalized columns and indexes can be added later without changing the contract.
