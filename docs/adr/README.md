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
| [0010](0010-quick-cards.md) | Quick Cards in the attendance library, every open audited |
| [0011](0011-sign-out-and-approved-adults.md) | Sign-out checks the approved list; anyone else needs the guardian's okay |
| [0012](0012-session-staff.md) | Staff are assigned per session; youth workers run only their own |
| [0013](0013-guardian-messages.md) | Guardian messages send through a per-tenant dispatcher behind provider abstractions |
| [0014](0014-permission-slips.md) | Slips send through the message path and answer to their own module |
| [0015](0015-guardian-links.md) | Guardian links carry a hashed token, a code trusts the device, and the link chooses the tenant |
| [0016](0016-reminders-and-tablet.md) | Reminders fall in slots, and the tablet signs in the guardian's record format |
| [0017](0017-roster-import.md) | Roster import reads CSV and XLSX itself, keeps the rows on the session, and runs in one request |
| [0018](0018-guardian-enrollment.md) | Enrollment links are per program, contacts are verified by code, and submissions wait as requests |
| [0019](0019-enrollment-review.md) | Enrollment requests are reviewed on the program roster, one by one or in bulk, and the guardian is texted |
| [0020](0020-guardian-home-link.md) | Enrollment decisions text a household home link, verified like a slip link |
| [0021](0021-incident-reporting.md) | Incidents are reported by any staff member and read by supervisors and the reporter only |
| [0022](0022-no-show-alerts.md) | No-show texts run in the send job fifteen minutes after start, and replies arrive by a signed webhook |
| [0023](0023-offline-check-in.md) | Offline check-in keeps the last roster and Quick Cards on the device and replays queued actions in order |
| [0024](0024-approved-pickups.md) | Approved pickups are their own rows beside the guardians, changed from the Quick Card and the family page |
| [0025](0025-staff-access.md) | Staff access is a membership read on every request; invitations are hashed links by email |
| [0026](0026-permitted-child-details.md) | Youth workers read only the children of their sessions, and see age rather than date of birth |
| [0027](0027-today-summary.md) | Today is one summary endpoint composed on the server from the modules that are on |
| [0028](0028-global-search.md) | Global search is one roster-scoped endpoint, and its page lives in the households library |
| [0029](0029-in-app-notifications.md) | In-app notifications are rows per recipient, hidden with their module, and the bell opens the center |
| [0030](0030-notification-settings.md) | Notification settings are one optional row per organization, read by jobs on every run |
