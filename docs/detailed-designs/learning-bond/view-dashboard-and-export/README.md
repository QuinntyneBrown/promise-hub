# View the dashboard and export for funders

## Overview

The Learning Bond dashboard (`learning-bond-dashboard`) shows admins and program directors six figures for the organization: households invited, started and completed, children with a submitted Learning Bond application, estimated dollars unlocked and confirmed dollars deposited, the two dollar figures split into Learning Bond and benefits, filtered by covered program and by the last 30 days, 90 days or all time. Export for funders (`export-learning-bond`) writes the same figures per covered program and a total row to a CSV kept for 7 days. Every figure is computed on read from `LearningBondApplication`, `LearningBondInvitation` and `LearningBondClaim` rows, never stored twice, and any figure resting on fewer than 5 households is suppressed as `L2-024` does (ADR 0076).

Terms used in this document:

- **figure** — count or sum over the covered households of the tenant for a program and period; "started" means a consent exists, "completed" means at least one application is `Submitted` or later
- **estimated dollars** — sum of the estimates of submitted Learning Bond applications plus the annual estimates of submitted benefit applications
- **confirmed dollars** — sum of the amounts providers and programs reported as `Deposited` or started
- **suppression** — a figure for a program resting on fewer than 5 households reads "Fewer than 5" on the page and "<5" in the CSV, with its dollars suppressed or blank

## Description

Frontend:

- **`LearningBondDashboardPage`** — `ph-chips` for program and period, six `ph-stat`s with the Learning Bond and benefits split as the caption, a `ph-table` by covered program with a total row, Export for funders and Covered households in the header. States: `empty` ("Families will appear here as they start."), `suppressed`, `filtered`, loading (`ph-skeleton` in the final layout), error (Try again), forbidden (no `ViewReports`, with a link to the families list). A `ph-alert` warning when a new agreement version is pending (`learning-bond-staff-notice` warning).
- **`ExportLearningBondDialog`** (CDK Dialog) — `ph-text-field` From and To dates, the column list, `ph-alert` info "Recorded in the audit log with the row count. The link works for 7 days.", Export; success body with the file name and Download; 422 "Choose a start date on or before the end date." inline.
- **`LEARNING_BOND_API`** — `getDashboard(filter)`, `export(request)`; the download uses the existing `REPORTS_API.download(exportId)`.

Backend:

- **`LearningBondDashboardHandler`** — `GET /learning-bond/dashboard?programId=&period=` (`ViewReports`, 403 otherwise, L2-141 criterion 4): resolves covered programs through `LearningBondCoverage`, loads the tenant's invitations, consents, claims and applications in the period, and computes the six figures overall and per program with `LearningBondFigures`. A per-program figure resting on fewer than 5 households is replaced by `Suppressed` and its dollars by null (criterion 3); the organization-wide figures follow the same rule. The query reads within the `L2-033` budget for reads: one aggregate query per table, no per-household round trip (criterion 5).
- **`LearningBondFigures`** (`PromiseHub.Application/LearningBond/`) — pure functions from the loaded rows to `LearningBondFiguresDto`: counts, the two sums each split by `ApplicationKind`, and confirmed dollars per completed household for the export. Deposits reported by `LearningBondApplication` webhooks count here and in the guardian's running total (L2-150).
- **`ExportLearningBondHandler`** — `POST /learning-bond/exports` (`ViewReports`): validates `from <= to` (422), computes the rows with `LearningBondFigures` for the period, writes one row per covered program and a total row with `ReportCsv`, each count of a row under 5 households as "<5" and its dollars blank (L2-143 criterion 2), stores a `ReportExport` of kind `LearningBond` named `{organization}-learning-bond-{from}-{to}.csv`, audits `Created` on `ReportExport` with the kind and row count, answers 201 with the export id and link (criterion 1 and 3). The existing export route answers the file for 7 days and 410 after (`ReportExport.Lifetime`, L2-025). `ReportExport` gains a `Kind` property, which the built class does not have today.
- **DTO rule** — the dashboard and the CSV carry counts, sums and program names only: no household, guardian or child name, contact, date of birth or identifier, and no per-family amount (L2-143 criterion 3). Northgate's rows are never read because every table is under the tenant filter (L2-141 criterion 4).

Tenant and module gate: both endpoints are in the `/learning-bond` group behind `RequireModule(ModuleId.LearningBond)`, so an organization with the module off answers 404 for the dashboard and the export (L2-143 criterion 4). Audited: each export as `Created` on `ReportExport`; opening the dashboard is a read of aggregates and is not audited.

## Requirements

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-141` | `L1-026` | Admins and program directors shall see uptake and dollars unlocked as counts and sums split by Learning Bond and benefits, filtered by program and period, with figures under 5 households suppressed and 403 without `ViewReports`. |
| `L2-143` | `L1-026` | Admins and program directors shall export the dashboard per covered program and a total row as a CSV without any family identifier, with "<5" suppression, audited and kept for 7 days. |
| `L2-024` | `L1-012` | Report numbers shall be shown for a period and program, with small counts suppressed. |
| `L2-025` | `L1-012` | One click shall export a CSV or funder template, kept for 7 days. |
| `L2-033` | `L1-018` | Reads shall answer within the performance budget measured on a mid-range phone over 4G. |

## Diagrams

A program director reads aggregates; a funder receives the CSV outside PromiseHub.

![C4 system context for the dashboard and export](diagrams/c4-context.png)

The API aggregates on read; the export file is stored with the other report exports.

![C4 container view for the dashboard and export](diagrams/c4-container.png)

One figures component serves both the dashboard and the export, so the two never disagree.

![C4 component view for the dashboard and export](diagrams/c4-component.png)

The application row is the source of every dollar figure; the export is a `ReportExport` of kind `LearningBond`.

![Class structure for the dashboard and export](diagrams/class-structure.png)

Loading the dashboard aggregates in one pass and suppresses small programs before answering.

![Sequence for loading the dashboard](diagrams/sequence-load-dashboard.png)

Exporting writes the same rows to a CSV, audits the row count and answers a 7-day link.

![Sequence for exporting for funders](diagrams/sequence-export.png)
