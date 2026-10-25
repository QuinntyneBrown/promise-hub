# Architecture decision records

One file per decision, numbered `NNNN-title.md`. Read the ones covering an area before changing it.

| ADR | Decision |
|---|---|
| [0001](0001-sqlite-for-persistence.md) | SQLite through EF Core for persistence and the test database |
| [0002](0002-tenant-isolation-with-query-filters.md) | Tenant isolation with a global query filter and a save guard |
| [0003](0003-plain-handlers-without-a-mediator.md) | Plain application handlers, no mediator library |
| [0004](0004-e2e-suite-as-its-own-package.md) | The e2e suite is its own npm package with a fake API |
| [0005](0005-cookie-sessions-and-totp.md) | Cookie sessions, a separate MFA ticket and TOTP |
| [0006](0006-module-gates-and-navigation.md) | Module gates, navigation mapping and dependency details |
| [0007](0007-soft-delete-and-command-results.md) | Soft delete, command results and client-side permission hints |
| [0008](0008-programs-and-events.md) | Programs and events as roster data, in-process draft slips |
| [0009](0009-sessions-are-events.md) | A session is an event; idempotent attendance |
