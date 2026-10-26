# 41 · Manage billing

> **Runtime:** ~2 min · **Audience:** contributors and product owners · **Prerequisites:** [40 · Switch organizations](../40-switch-organizations/README.md)

**Video:** [41-manage-billing.mp4](41-manage-billing.mp4) · [Slides](slides.html) · **Audio:** [41-manage-billing.mp3](41-manage-billing.mp3) · [Transcript](script.md)

## Why this video exists

Slice 41 ([prompt](../../prompts/41-manage-billing.md)) lets an admin check child and SMS usage, see limits and change plans, with failed payments leading to grace and suspension.

## Learning objectives

By the end, the viewer can:

- name the plans and their limits;
- explain where the child limit is enforced;
- describe proration and the payment grace period.

## Key questions

| Question | What a strong answer includes |
|---|---|
| What is an active child? | Enrolled in at least one program now, counted once |
| When is the limit checked? | Enrolling a child, and accepting enrollments in review |
| What happens after a failed payment? | 14 days of grace, then Suspended |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Domain/Billing/PlanTerms.cs` | the plans |
| `backend/src/PromiseHub.Application/Billing/BillingHandler.cs` | proration and status |
| `docs/adr/0035-billing.md` | the decision |
| `clips/billing-desktop.mp4` | the running app with the fake API |
| `shots/*.png` | payment failed and Free |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:55 | Introduction, promises | Plans and limits |
| 00:55-01:15 | Upgrading | Standard to Plus |
| 01:15-01:25 | Limits | Payment and Free |
| 01:25-02:00 | Testing, recap | Cases |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter BillingTests
cd e2e; npx playwright test tests/administration/billing.spec.ts
```

## Pitfalls

- No payment processor: proration is shown, not charged; card updates and invoices are not built.

## References

- [WCAG 2.2: Status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages)
