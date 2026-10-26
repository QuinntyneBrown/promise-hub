# 48 · Operational readiness

> **Runtime:** ~3 min · **Audience:** contributors, operators and product owners · **Prerequisites:** [47 · Manage organizations](../47-manage-organizations/README.md)

**Video:** [48-operational-readiness.mp4](48-operational-readiness.mp4) · [Slides](slides.html) · **Audio:** [48-operational-readiness.mp3](48-operational-readiness.mp3) · [Transcript](script.md)

## Why this video exists

Slice 48 adds structured request logs, per-tenant request metrics, on-call alerts, and performance budgets measured in CI (`L2-041`, `L2-033`, ADR 0042).

## Learning objectives

By the end, the viewer can:

- say what each request's log line records and what it never records;
- name the two alerts, when each fires, and why each fires only once;
- list the budgets that the build measures and where they are measured.

## Key questions

| Question | What a strong answer includes |
|---|---|
| What is logged? | Tenant, route template, status, duration, correlation id; never a name or token |
| When does the error-rate alert fire? | Over 1% of at least 20 requests in 5 minutes |
| When does the queue alert fire? | A delivery queued over 10 minutes, naming its organization |
| Where are the budgets measured? | The `budgets` Playwright project on the production build, and API tests reading `RequestMetrics` |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Api/Middleware/RequestLoggingMiddleware.cs` | The one log line per request |
| `backend/src/PromiseHub.Infrastructure/Observability/OpsAlertMonitor.cs` | The two alert rules |
| `e2e/tests/shell/performance-budgets.spec.ts` | The page, check-in and search budgets |
| `clips/fault-desktop.mp4`, `clips/check-in-phone.mp4` | Recorded against the running frontend with a faked API |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:42 | Introduction, logs | One line per request |
| 00:42-01:02 | Faults | Server error page and Try again |
| 01:02-01:28 | Alerts | Error rate and queue age |
| 01:28-02:00 | Budgets | Check-in on a phone; the budget table |
| 02:00-02:49 | Testing, recap | Cases and what is deferred |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter "AlertTests|ObservabilityTests|PerformanceBudgetTests"
cd e2e; npx playwright test --project=budgets --no-deps
node tools/video-record/record-clips.mjs docs/videos/48-operational-readiness --base http://localhost:4317
```

## Pitfalls

- The CI runner is not a mid-range phone on 4G: the budgets catch regressions, they do not prove field numbers.
- Measure the production build; the dev server's cold paint is slower than the budget.

## References

- [Observability in ASP.NET Core (Microsoft Learn)](https://learn.microsoft.com/aspnet/core/log-mon/metrics/metrics)
- [First Contentful Paint (web.dev)](https://web.dev/articles/fcp)
