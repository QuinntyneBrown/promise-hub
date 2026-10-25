# Implementation prompts

One ready-to-run prompt per slice, made with the `writing-feature-prompts` skill. Run them in order; each assumes the ones before it are done. Each takes its journey from mocks to a merged pull request with ATDD, and ends with a narrated, on-brand journey video with music in `docs/videos/`.

Order: the highest-value journeys come first (check-in, Quick Cards, sign-out, messages and slips). Supporting slices sit where the architecture needs them: tenancy, seed, the shell and audit before anything else; sign-in and module gates before feature journeys; roster, programs and events before attendance; guardian links with the first guardian journey; background jobs with messages.

| # | Slice | Persona | Kind | Why here |
|---|---|---|---|---|
| 01 | [Walking skeleton: tenancy, migrate and seed, shell, audit recording](01-walking-skeleton.md) | Everyone | Supporting | Every journey needs tenancy, seed data, the shell and audit. Building them first, thinly, keeps later journeys small. |
| 02 | [Sign in securely](02-sign-in-securely.md) | Staff | Journey | Nothing else can be used without it; it also establishes the authorization pattern. |
| 03 | [Configure modules (with server-side module gates)](03-configure-modules.md) | Admin / office manager | Journey | AGENTS.md requires a module-off case in every feature's tests, so the gate must exist before the feature journeys. |
| 04 | [Maintain households](04-maintain-households.md) | Admin / office manager | Journey | Roster is the data every module reads; check-in, slips and messages are worthless without it. |
| 05 | [Create programs and events](05-create-programs-and-events.md) | Program director | Journey | Today's sessions, check-in and slips all hang off programs and events. |
| 06 | [Check children in](06-check-children-in.md) | Site lead | Journey | The highest-value daily task in the PRD: knowing exactly who is here. |
| 07 | [Read a Quick Card](07-read-a-quick-card.md) | Site lead | Journey | Child safety: the second most valuable thing on a phone at the door. |
| 08 | [Sign children out](08-sign-children-out.md) | Site lead | Journey | Completes the safety loop started by check-in. |
| 09 | [Record attendance within assigned permissions](09-record-attendance-as-youth-worker.md) | Youth worker | Journey | Small slice that hardens permissions on the most-used flow. |
| 10 | [Send guardian messages (with SMS cap)](10-send-guardian-messages.md) | Program director | Journey | Reaching families is core value and slips depend on it. At 9 days this is large; keep the slices thin. |
| 11 | [Send permission slips](11-send-permission-slips.md) | Program director | Journey | Paper slips are the PRD's biggest pain point. |
| 12 | [Sign a permission slip (with verified guardian links)](12-sign-a-permission-slip.md) | Guardian | Journey | Closes the slips loop and introduces guardian links, which every later guardian journey reuses. |
| 13 | [Resolve missing slips](13-resolve-missing-slips.md) | Site lead | Journey | Makes slips work on the day of the trip. |
| 14 | [Import a roster](14-import-a-roster.md) | Admin / office manager | Journey | Onboarding a real organization needs its existing roster fast. |
| 15 | [Enroll a child](15-enroll-a-child.md) | Guardian | Journey | Self-enrollment removes office data entry. |
| 16 | [Review enrollment](16-review-enrollment.md) | Admin / office manager | Journey | Completes enrollment. |
| 17 | [Track enrollment status](17-track-enrollment-status.md) | Guardian | Journey | Small, reuses enrollment. |
| 18 | [Manage waitlists](18-manage-waitlists.md) | Program director | Journey | Small, reuses enrollment and programs. |
| 19 | [Report an incident](19-report-an-incident.md) | Site lead | Journey | Safety and liability. |
| 20 | [Report an incident as a youth worker](20-report-an-incident-as-youth-worker.md) | Youth worker | Journey | Small permission slice. |
| 21 | [Review incidents](21-review-incidents.md) | Program director | Journey | Completes incidents. |
| 22 | [Follow up no-shows](22-follow-up-no-shows.md) | Site lead | Journey | Safety: knowing who did not arrive. |
| 23 | [Respond to an absence alert](23-respond-to-an-absence-alert.md) | Guardian | Journey | Completes no-show loop. |
| 24 | [End a session](24-end-a-session.md) | Site lead | Journey | Clean attendance data for reports. |
| 25 | [Run check-in offline](25-run-check-in-offline.md) | Site lead | Journey | Gyms and church basements have poor signal. |
| 26 | [Manage approved pickups](26-manage-approved-pickups.md) | Guardian | Journey | Feeds safe sign-out. |
| 27 | [Confirm an exceptional pickup](27-confirm-an-exceptional-pickup.md) | Guardian | Journey | Edge of the safety loop. |
| 28 | [Update household details](28-update-household-details.md) | Guardian | Journey | Keeps the roster current without office work. |
| 29 | [Manage staff access](29-manage-staff-access.md) | Admin / office manager | Journey | Needed before more staff can use the app. |
| 30 | [Start an invited shift](30-start-an-invited-shift.md) | Youth worker | Journey | Completes staff access. |
| 31 | [Coordinate staff coverage](31-coordinate-staff-coverage.md) | Volunteer coordinator | Journey | Small, reuses staff. |
| 32 | [Use permitted child details](32-use-permitted-child-details.md) | Youth worker | Journey | Privacy hardening. |
| 33 | [Monitor today's work](33-monitor-todays-work.md) | Program director | Journey | Comes after the modules it summarises exist. |
| 34 | [Search records](34-search-records.md) | Staff | Journey | Speeds every staff task. |
| 35 | [Review notifications](35-review-notifications.md) | Staff | Journey | Ties alerts together. |
| 36 | [Configure notifications](36-configure-notifications.md) | Admin / office manager | Journey | Small settings slice. |
| 37 | [Produce grant reports](37-produce-grant-reports.md) | Program director | Journey | High value for funding but needs months of data first. |
| 38 | [Complete a survey](38-complete-a-survey.md) | Guardian | Journey | Feeds outcomes reporting. |
| 39 | [Set up an organization](39-set-up-an-organization.md) | Admin / office manager | Journey | Composes features already built, so it comes after them. |
| 40 | [Switch organizations](40-switch-organizations.md) | Volunteer coordinator | Journey | Multi-tenant people. |
| 41 | [Manage billing](41-manage-billing.md) | Admin / office manager | Journey | Revenue; at 8 days keep slices thin. |
| 42 | [Configure privacy](42-configure-privacy.md) | Admin / office manager | Journey | Compliance. |
| 43 | [Request household data](43-request-household-data.md) | Guardian | Journey | Compliance. |
| 44 | [Review audit history](44-review-audit-history.md) | Admin / office manager | Journey | Recording exists since the skeleton; this adds search. |
| 45 | [Manage sessions](45-manage-sessions.md) | Staff | Journey | Account hygiene. |
| 46 | [Recover account access](46-recover-account-access.md) | Staff | Journey | Needed but rarely used; no design exists yet. |
| 47 | [Create, manage and suspend organizations](47-manage-organizations.md) | Platform admin | Journey | Seed data covers tenants until sales scale. |
| 48 | [Operational readiness: observability and performance budgets](48-operational-readiness.md) | Everyone | Supporting | Hardening before wide launch. |
