# Architecture decision records

One file per decision, numbered `NNNN-title.md`. Read the ones covering an area before changing it.

| ADR | Decision |
|---|---|
| [0001](0001-sqlite-for-persistence.md) | SQLite through EF Core for persistence and the test database |
| [0002](0002-tenant-isolation-with-query-filters.md) | Tenant isolation with a global query filter and a save guard |
| [0003](0003-plain-handlers-without-a-mediator.md) | Plain application handlers, no mediator library |
| [0004](0004-e2e-suite-as-its-own-package.md) | The e2e suite is its own npm package with a fake API |
