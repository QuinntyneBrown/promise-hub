# Estimates

- Overall effort: 610 days
- Complete: 79%

| Subsystem | Effort | Complete |
|---|---|---|
| [identity](identity.md) | 39 days | 88% |
| [organizations](organizations.md) | 46 days | 75% |
| [platform](platform.md) | 29 days | 47% |
| [shell](shell.md) | 9 days | 51% |
| [households](households.md) | 6 days | 80% |
| [programs](programs.md) | 8 days | 81% |
| [staff](staff.md) | 22 days | 94% |
| [enrollment](enrollment.md) | 17 days | 97% |
| [events](events.md) | 16 days | 88% |
| [attendance](attendance.md) | 43 days | 81% |
| [messaging](messaging.md) | 25 days | 66% |
| [notifications](notifications.md) | 16 days | 75% |
| [slips](slips.md) | 17 days | 70% |
| [guardian](guardian.md) | 24 days | 90% |
| [incidents](incidents.md) | 6 days | 70% |
| [reports](reports.md) | 32 days | 80% |
| [imports](imports.md) | 7 days | 80% |
| [billing](billing.md) | 10 days | 50% |
| [audit](audit.md) | 6 days | 80% |
| [search](search.md) | 4 days | 70% |
| [learning](learning.md) | 48 days | 100% |
| [curriculum](curriculum.md) | 27 days | 97% |
| [mentoring](mentoring.md) | 37 days | 100% |
| [website](website.md) | 23 days | 94% |
| [learning-bond](learning-bond.md) | 93 days | 56% |

## Roadmap

1. Identity, organizations and platform foundations: sign-in, authorization, tenancy, migration, security and jobs.
2. Shell, household, program and staff foundations: accessible navigation, shared records, program setup and onboarding.
3. Enrollment, attendance and imports: guardian enrollment, roster import, session flow, pickup, Quick Cards and offline support.
4. Messaging, notifications, permission slips and guardian experiences: delivery controls, notification center, signing, reminders, localized guardian pages and incidents.
5. Reports, billing and audit: computation and export, plan metering and payments, then organization audit search.
6. Waypoint journeys (prompts 50 to 81) are delivered on the merge foundation; what remains is their deferred work, such as the public website's staff inbox and a real payment provider (ADR 0075).
7. Learning Bond (`L2-135` to `L2-163`, ADR 0076): the module gate and agreement, coverage and launch, the guardian claim, the benefits check, the agent and the dashboard; the module gate, the encrypted SIN store and the audit entries are built (prompt 82), and so are the agreement with a named signer request, coverage, the invitation preview and the Settings hub (prompt 83), the signer's own page (prompt 84), and the launch, the invitation at the door, the covered households with their status and call requests (prompt 85), and the guardian claim: the page from the link, per-child consent, the intake with encrypted SINs, the estimate, the review with a recommended provider and Submit, and the card on the guardian home (prompt 86). Following a claim is built too: the submitted page, the signed provider webhook applied once per event, documents sent only on Send, pauses with reminders at 14 and 30 days, resuming from the link and the 180-day close (prompt 87, ADR 0081), and withdrawing consent for a child, which destroys the child's financial data and keeps only what a provider already holds (prompt 88). A real provider channel, inbound STOP and the model-backed agent (prompt 92) remain.
