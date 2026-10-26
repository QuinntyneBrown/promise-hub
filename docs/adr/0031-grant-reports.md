# 0031: Reports are computed on request from the roster and check-ins; exports are stored CSV files that expire in seven days

- Status: accepted
- Date: 2026-10-26

## Context

Prompt 37 asks a program director to filter attendance, demographics and outcomes and export funder-ready results with small counts masked (`L2-024`, `L2-025`).

## Decision

- **Compute on request.** `ReportCalculator` reads enrollments, sessions that have started, attendance records, signatures and households for the tenant, filtered by program (and optionally a date range). Children served means children enrolled now; the attendance rate is present (or signed out) over present plus absent. No figures are stored or retyped.
- **Roles.** New `ViewReports` (admins, directors, site leads) gates `/reports` with the Reports module. New `ReadSmallCounts` (admins, directors) sees exact counts under 5 on screen; everyone else sees "<5".
- **Exports.** `POST /reports/exports` writes a CSV, always masked, into `ReportExport` (tenant-owned) with a seven-day expiry, and audits the requester, file name and row count. `GET /reports/exports/{id}` returns the file, 410 after expiry, 404 for another organization.
- **Frontend.** `REPORTS_API`; `ReportsPage` and `ExportDialog` in the `reports` library. The `download` icon was added to the components library from the design system.

## Consequences

Not built yet: demographics by gender (the roster has no gender field), funder XLSX templates, custom date ranges in the page, and background exports with email for very large files. Exports are small CSVs, so they finish inline.
