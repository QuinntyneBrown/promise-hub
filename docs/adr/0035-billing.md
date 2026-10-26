# 0035: Plans are fixed terms in the domain; limits are enforced where children join; payments are modelled, not processed

- Status: accepted
- Date: 2026-10-26

## Context

Prompt 41 asks an admin to check child and SMS usage, see limits, change plans, and have failed payments lead to grace and suspension (`L2-037`, `L2-022`). There is no payment processor in the repository.

## Decision

- **Plans.** `PlanTerms` fixes price, active-child limit and SMS segments: Free $0, 50, 200; Standard $89, 500, 2,000; Plus $149, 2,000, 5,000. An active child is enrolled in at least one program now and counts once.
- **Limits where children join.** `PlanLimit` refuses the child that would pass the limit in `EnrollChildHandler` and when accepting enrollments in review; children already active don't count again.
- **Changing plan.** `PUT /billing/plan` (new `ManageBilling`, admins only) refuses the current plan, an unknown plan or one smaller than the active children; an upgrade returns the prorated difference for the days left in the organization's month (today included) and is audited. Without a custom SMS cap the month's cap follows the plan.
- **Payments.** `Organization.PaymentFailedAt` records a failed payment; billing shows PaymentFailed for 14 days, then Suspended. The processor's webhook, card updates and invoices are not built; enforcing suspension (blocking access and messages) belongs to platform administration (prompt 47).
- **Frontend.** `BILLING_API`; `BillingPage` and `ChangePlanDialog` in the `administration` library at `/settings/billing`.

## Consequences

Proration is shown, not charged. Downgrades take effect at once with no credit.
