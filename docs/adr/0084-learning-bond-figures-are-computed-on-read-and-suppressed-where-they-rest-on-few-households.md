# 0084: Learning Bond figures are computed on read and suppressed where they rest on few households

- Status: accepted
- Date: 2026-10-30

## Context

Prompt 91 adds the Learning Bond dashboard and the funder export (`L2-141`, `L2-143`). The design named `LearningBondFigures` computed on read, small-count suppression as in `L2-024`, and an export through the existing reports exports. In `RolePermissions`, site leads hold `ViewReports`, while the requirement named a site lead as a role without it. The staff menu's Learning Bond item already opens Covered households for the status roles, and the existing tests rely on that.

## Decision

- **Figures are computed on every read.** `LearningBondFigures.ComputeAsync` reads the tenant's covered households, filtered by covered program and by the last 30 or 90 days or all time:
  - invited: households with an invitation;
  - started: households with a Learning Bond claim;
  - completed: households with an application sent;
  - children: children with a submitted Learning Bond application;
  - estimated dollars: Learning Bond estimates of submitted applications, plus the benefits' annual estimates by the catalogue's rules, where a confirmed amount stands in once a benefit started;
  - confirmed dollars: deposits and benefits started.

  Nothing is cached or stored.
- **Suppression is one rule for the page and the export.** A count from 1 to 4 reads "Fewer than 5" on the page and "<5" in the CSV. A figure's dollars are withheld whenever the households it rests on (started or completed) number 1 to 4. Zero is shown, since it reveals no family.
- **The export is a `ReportExport`.** The CSV, with a row per covered program and a total, is stored, kept 7 days and downloaded through `GET /reports/exports/{id}` like every export. Its audit summary names it as a Learning Bond export with its row count. It carries no name, contact, date of birth or identifier.
- **Site leads see the dashboard**, as they see every report. The forbidden case is a role without `ViewReports`, such as a youth worker.
- **The menu keeps opening Covered households.** It gains a Dashboard button for report roles, and the dashboard links back with Covered households.

## Consequences

- The dashboard reads a household's records once per figure set. That is fine at an organization's scale, and a cache can come later if needed.
- With fewer than 5 households a program shows only that it has some families. That is the point.
