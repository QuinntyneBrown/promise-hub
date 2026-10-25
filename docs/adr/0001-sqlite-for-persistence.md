# 0001: SQLite for persistence and the test database

- Status: accepted
- Date: 2026-10-25

## Context

The specs and designs name no database. Backend tests must use a fake database with no server, Docker or Testcontainers, and the CLI owns migrations.

## Decision

Use EF Core with the SQLite provider. Local development uses a file (`backend/promisehub.dev.db`); integration tests use a private shared-cache in-memory database per test host, migrated and seeded through `CliApp`. Migrations live in `PromiseHub.Infrastructure/Persistence/Migrations/`.

## Consequences

- Tests exercise real migrations and real SQL, not the EF in-memory provider.
- SQLite cannot order by `DateTimeOffset`; such columns are stored as UTC ticks.
- A move to a server database for production needs a new provider and a fresh migration set; record it in a new ADR.
