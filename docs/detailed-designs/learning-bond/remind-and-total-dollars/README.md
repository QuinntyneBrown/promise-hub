# Remind and total dollars

## Overview

A finished benefits check sets reminders tied to the household's dates (`learning-bond-reminders`): "File your {year} taxes" on March 15 each year, "{first name} turns 6" and "{first name} turns 18" 30 days before each birthday still ahead, and each received or applied-for benefit's renewal date from the catalogue, each with Turn off. `LearningBondReminderJob` runs per tenant at 10:00 in the organization's time zone and sends each due reminder once, as one text through `MessageWriter`, with email when the household has no mobile number or the SMS cap is reached. The guardian also sees a running total (`learning-bond-total`): "Unlocked so far: ${confirmed}" and "Applied for: up to ${estimated}", split by child and stream, or "Nothing confirmed yet". A program reports a started benefit through a signed webhook, which updates the total and texts "{benefit} has started for your family. You've unlocked ${total} so far."

Terms used in this document:

- **reminder** — `LearningBondReminder`: kind (`FileTaxes`, `TurnsSix`, `TurnsEighteen`, `BenefitRenewal`), household, child or application, due date, turned off, sent at
- **confirmed** — deposits of the Learning Bond and the first year of each benefit that started, read from `LearningBondApplication` rows with `ConfirmedAmount`
- **applied for** — estimates of submitted applications not yet confirmed, read from `EstimatedAmount`

Both jobs and both pages run in the link's organization; the webhook takes its organization from the stored application. Reminders turned off, reminders sent and program events are audited; the total is never answered to a staff endpoint and no staff DTO carries an amount (ADR 0076).

## Description

Frontend:

- **`RemindersPage`** (`learning-bond-reminders`) — `ph-card` list with one row per reminder (`ph-date-badge`, kind, date line) and `ph-button` Turn off with an accessible label naming the reminder; a `ph-badge` Off once turned off, with an Undo toast; empty state "No reminders" with Check benefits.
- **`TotalPage`** (`learning-bond-total`) — `ph-stat` "Unlocked so far" with "Applied for" beneath, `ph-table` By child and stream with Confirmed and Applied for columns and a Total row; "Nothing confirmed yet" when nothing is confirmed. Amounts follow the household's locale ("1 200 $" in French).
- **`learning-bond-sms`** — the reminder and benefit-started texts previewed with `ph-sms-preview` in the mocks; the texts themselves are platform copy from `LearningBondTexts`.
- **`LEARNING_BOND_API`** — `listReminders(token)`, `turnOffReminder(token, id)`, `getTotal(token)`.

Backend:

- **`ReminderPlanner`** — after a benefits check (also when every benefit is already received) and after each submission or program event, upserts the household's reminders: March 15 of the next year for `FileTaxes`, the date 30 days before each child's sixth and eighteenth birthday still ahead, and the catalogue entry's `RenewalRule` for each received or applied-for benefit. A date already past is never created.
- **`TurnOffReminderHandler`** — sets `TurnedOffAt`; the job skips it for good; audits Reminder turned off.
- **`LearningBondReminderJob`** (`Infrastructure/LearningBond/`) — a per-tenant recurring job of `run-background-jobs` scheduled at 10:00 in the organization's time zone. It exits without effect when the module is off, the organization is suspended or the household's Benefits consent is withdrawn; otherwise it queues one `MessageWriter.Queue(MessageSource.LearningBond, …)` per due reminder in the household's language with what to do and a link, with the idempotency key `(reminderId)`, and sets `SentAt`. The send job applies the SMS cap, the email fallback and STOP. When the module is turned back on, only reminders whose date is still ahead resume.
- **`GetTotalHandler`** — sums the household's `LearningBondApplication` rows: `ConfirmedAmount` of `Deposited` Learning Bond applications and started benefits, `EstimatedAmount` of `Submitted` and `Received` ones, grouped by child and stream; answers `TotalDto`. Rows of another household are never read.
- **`ProgramWebhookHandler`** — `POST /learning-bond/webhooks/programs/{program}` verifies the signature through `IWebhookSignatureVerifier`, finds the application by the program's reference, takes the organization from it (404 when the module is off there), applies each event once by its id (`BenefitStarted` sets `ConfirmedAmount` to the first-year amount and `Status = Received`), re-plans the renewal reminder, queues the benefit-started text with the new total and audits Program event.
- **Endpoints** — `GET /g/learning-bond/{token}/reminders`, `POST .../reminders/{id}/off`, `GET .../total` (`LearningBondGuardianEndpoints.cs`); the webhook route is anonymous and signed (`LearningBondEndpoints.cs`).

## Requirements

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-157` | `L1-028` | The agent shall set reminders tied to the household's dates: filing taxes, a child turning 6 or 18, and each benefit's renewal. |
| `L2-158` | `L1-028` | The guardian shall see the dollars unlocked so far across the Learning Bond and benefits, and each follow-up text shall carry it. |
| `L2-021` | `L1-010` | Messages to guardians shall be composed and sent through Messages with the chosen channels. |
| `L2-022` | `L1-010` | Each organization shall have a monthly SMS segment cap by plan; at the cap, texts pause and email continues. |
| `L2-034` | `L1-018` | Background jobs shall run per tenant, recover from failure and never send a message twice. |
| `L2-032` | `L1-017` | Every change and every sensitive view shall be recorded in the organization's audit log and searchable by admins. |

## Diagrams

Reminders reach the guardian through the messaging providers; benefit programs report started benefits back.

![C4 system context for remind and total dollars](diagrams/c4-context.png)

The reminder job runs in the API process per tenant; the webhook enters through the API and finds its tenant in the database.

![C4 container view for remind and total dollars](diagrams/c4-container.png)

The job and the webhook handler both queue through `MessageWriter`; the total handler only reads.

![C4 component view for remind and total dollars](diagrams/c4-component.png)

A reminder is one row with one send; the total is computed from application rows, never stored.

![Class structure for remind and total dollars](diagrams/class-structure.png)

The job sends each due reminder once at 10:00 local and nothing while the module is off, the organization suspended or the consent withdrawn.

![Sequence for the reminder job](diagrams/sequence-reminder-job.png)

A signed program event updates one application, the total and the guardian's text, once.

![Sequence for the program webhook](diagrams/sequence-program-webhook.png)
