# 0042: Request metrics and alerts run in process; performance budgets are measured in the Playwright suite on the production build

- Status: accepted
- Date: 2026-10-26

## Context

Prompt 48 hardens PromiseHub before wide launch (`L2-041`, `L2-033`). The design leaves the log store, metrics collector, paging tool, Lighthouse CI and a k6 staging environment open, and none of them exists yet. The checks still need to run in CI today.

## Decision

- **Logs.** `RequestLoggingMiddleware` writes one structured line per request (tenant, route template, status, duration, correlation id). It sits outside `ExceptionHandlingMiddleware`, which answers a fault with a 500 carrying only a reference.
- **Metrics.** `RequestMetrics` (Infrastructure, a singleton) keeps the last five minutes of request samples in memory, per tenant. It reports the request count, the count of server errors and the 95th percentile duration. It is not exported anywhere yet.
- **Alerts.** `OpsAlertMonitor` runs every minute from `OpsAlertHostedService` (`Ops:Alerts`, on by default). It raises `error-rate` when more than 1% of at least 20 requests failed, and `queue-age` per tenant when a delivery has been queued more than ten minutes past its due time. Each alert is raised once when its condition starts and again only after the condition clears. It goes through `IAlertSender`. The default `LoggingAlertSender` writes a critical `ALERT` log line for the log platform to route, and a paging provider can replace it later.
- **Budgets.** A `budgets` Playwright project runs `e2e/tests/shell/performance-budgets.spec.ts` against `ng serve --configuration production` on port 4318, with Pixel 7 emulation and one test at a time. It checks cold first contentful paint (under 1.5 s) and DOM interactive (under 2.5 s) on Today, Check-in, Families, Events and Reports. It also checks that the check-in row updates within 300 ms and that each search keystroke settles within 200 ms, timed inside the page. `PerformanceBudgetTests` reads `RequestMetrics` to check the server's p95 for check-ins (under 1 s) and for two tenants' concurrent session reads (under 500 ms).

## Consequences

- Budgets fail the existing `e2e` and `backend` CI jobs; no new service is needed.
- The CI runner is not a mid-range phone on 4G. The budgets catch regressions; they do not prove field numbers.
- Deferred: OpenTelemetry export and dashboards, a paging integration, the backup-failed and SMS-cap alert rules, Lighthouse with 4G throttling, a 212-child roster seed with frame-rate checks, and the k6 load test across 50 organizations on staging.
