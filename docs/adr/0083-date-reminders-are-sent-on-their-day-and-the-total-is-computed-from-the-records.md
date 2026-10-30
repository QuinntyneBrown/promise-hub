# 0083: Date reminders are sent on their day, and the total is computed from the records

- Status: accepted
- Date: 2026-10-30

## Context

Prompt 90 sets reminders on the dates that matter to a household and keeps a running total of dollars unlocked (`L2-157`, `L2-158`). The design named a daily `LearningBondReminderJob` at 10:00 per tenant and a stored total. The codebase already sends every timed message from `MessageDispatchRunner` per organization (ADR 0079, ADR 0081). `L2-157` says a reminder whose date passed while Learning Bond was off is never sent.

## Decision

- **Reminders are rows planned when a benefits check finishes.** `LearningBondDatePlanner` adds them idempotently: the next March 15 for taxes, each child under 18 turning 6 and 18 (30 days before), and the next renewal of each benefit received or applied for (`BenefitCatalogueEntry.Renews`). It runs again when an application is submitted or marked sent. An existing reminder, turned off or not, is kept.
- **They are sent on their day only.** `LearningBondClaimJob` runs per organization from the dispatch runner.
  - A reminder due today is sent from 10:00 local, once, through Messages, while the Benefits consent is in force.
  - A reminder whose day passed unsent, because the module was off or the organization suspended, is marked missed and never sent late.
  - A tax reminder sent sets next year's.
- **The total is computed, never stored.** `LearningBondTotals` reads the household's own records on every request:
  - Learning Bond deposits, or estimates while unconfirmed, per child;
  - each benefit sent: its confirmed first year, or its estimate by the catalogue's rule, split by child as the rule weighs them.

  Staff have no endpoint for it.
- **A program reports through its own signed webhook.** `POST /learning-bond/webhooks/programs/{program}` is signed under `LearningBond:Webhooks:{program}` and applied once per event id (as ADR 0081 does for providers). It records the confirmed amount and texts the household the benefit and the new total.

## Consequences

- A dispatch outage that spans a reminder's whole day skips that reminder.
- A total is always current, but it is computed on each request. That is cheap for a household's handful of records.
- Each program needs its webhook secret configured before its events are accepted.
