# Follow the application's progress

## Overview

After Submit, `learning-bond-submitted` shows "Sent to {provider} on {date}", the fields sent with SINs masked, the estimate, "What happens next" in three steps and a date chip for the expected deposit window from the provider's processing time. The provider reports progress through a signed webhook; each event is applied once, moves the application's status and texts the guardian in the household's language. A missing document is uploaded through the link and sent only on Send. A claim that cannot go on pauses on `learning-bond-paused` with plain help, offers a reminder at 14 and 30 days, resumes from the same link at the step it paused on, and closes as `Not completed` after 180 idle days.

Terms used in this document:

- **deposit window** — `SubmittedAt + ProcessingDays.Min` to `SubmittedAt + ProcessingDays.Max` from `RespProvider`, shown as "Expected Jan 15 – Feb 28, 2027"
- **provider event** — webhook body with `EventId`, `Reference`, `Kind` (`Received`, `Deposited`, `DocumentNeeded`), `Amount`, `DocumentName`; applied once by `EventId`
- **paused reason** — `PausedReason.NeedsSin` or `NeedsTaxReturn` on `LearningBondClaim`, with the step to resume at
- **reminder** — `LearningBondReminder` of kind `ResumeClaim` due 14 and 30 days after the pause, each sent once by `LearningBondReminderJob`

Guardian routes resolve the tenant through `GuardianAccess`; the webhook has no token, so `ProviderWebhookHandler` finds the application by the provider's reference, takes the organization from it, and answers 404 when the module is off for that organization or the reference is unknown, 401 on a bad signature. Status changes, document sends, pauses, reminders and the 180-day close are audited by id and field name; no audit entry, text or log carries a SIN or a document's contents (`L2-032`, `L2-159`). Guardian DTOs carry `Last3` only.

## Description

Frontend:

- **`LearningBondSubmittedPage`** (`frontend/projects/learning-bond/`, route `/g/learning-bond/:token/submitted`) — `ph-card` What happens next as a three-step list with Done badges, `ph-date-badge` for the deposit window, `ph-card` What was sent as a facts list with `••• ••• 417`, `ph-alert` success (Received, Deposited with See your total) or warning (document needed), a file `ph-text-field` variant accepting PDF, JPEG and PNG up to 10 MB with the error "That file is 14 MB. Choose a PDF, JPEG or PNG up to 10 MB." and `ph-button` Send to {provider}, disabled until a file is chosen.
- **`LearningBondPausedPage`** (route `/g/learning-bond/:token/paused`) — `ph-badge` warning Paused · needs a SIN or Paused · needs a tax return, the agent's fixed explanation, `ph-card` How to get {first name}'s SIN with the Service Canada link in the household's language, or File for free with the free tax clinic finder for the province; `ph-radio-group` "Remind you in 14 days?" Yes, text me / No thanks and Save; `ph-alert` with the two reminder dates; the resumed state offers Continue to the paused step; the closed state shows Not completed and Start again.
- **`learning-bond-sms`** — the texts are rendered by Messages; the page previews none.
- **`LEARNING_BOND_API.getProgress(token, applicationId)`**, **`uploadDocument(token, applicationId, file)`**, **`sendDocument(token, documentId)`**, **`pauseClaim(token, childId, reason)`**, **`setReminder(token, childId, remind)`**.

Backend:

- **`LearningBondProgressHandler.GetAsync`** (`PromiseHub.Application/LearningBond/`) — the submitted view: provider, `SubmittedAt`, fields as sent with `Last3`, estimate and rule version, the three steps with the furthest reached, the deposit window from `RespProvider.ProcessingDays`, and any open `LearningBondDocument` request.
- **`ProviderWebhookHandler.HandleAsync`** — `IWebhookSignatureVerifier.Verify(provider, headers, body)` or 401; application by `ProviderReference` and provider or 404; `TenantContext.ResolveForJob(application.OrganizationId)`; module on or 404; `EventId` already in `AppliedEventIds` answers 200 and changes nothing. Otherwise: `Received` sets `ReceivedAt` and status `Received`; `Deposited` sets `DepositedAt`, `DepositAmount` and status `Deposited`, which the dashboard and the running total count; `DocumentNeeded` creates a `LearningBondDocument` request with the name. Each then queues one text through `MessageWriter` as `MessageSource.LearningBond` with the `LearningBondTexts` line in the household's language ("{provider} received {first name}'s application.", "${amount} was deposited in {first name}'s RESP.", "{provider} needs {document} for {first name}. Tap to send it: {link}"); the send job applies the SMS cap, STOP and email fallback. A declined invitation or withdrawn consent suppresses the text.
- **`LearningBondDocumentHandler`** — `UploadAsync` accepts `application/pdf`, `image/jpeg`, `image/png` up to 10 MB (422 otherwise), encrypts through `ILearningBondCipher` and stores in `IFileStore` with `SentAt` null; `SendAsync` is the guardian's own act: decrypts in memory, calls `IRespProviderChannel.SendDocumentAsync` once under a `SubmissionKey`, sets `SentAt`; `LearningBondDestructionJob` deletes the content 24 hours later (`complete-intake`).
- **`LearningBondPauseHandler`** — `PauseAsync` sets `Status.Paused`, `PausedReason` and `ResumeStep`; `SetReminderAsync` creates two `LearningBondReminder` rows (14 and 30 days) or none; a resume request answers `ResumeStep` so the intake reopens at the paused question with every stored answer kept (`L2-151` criterion 4).
- **`LearningBondReminderJob`** (`PromiseHub.Infrastructure/LearningBond/`, daily, per tenant) — queues each due, unsent reminder through `MessageWriter` with the resume link, marks it `SentAt`, and sends nothing while the module is off, the organization is suspended, the guardian replied STOP, the consent is withdrawn or the invitation is declined. The 180-day close belongs to `LearningBondDestructionJob`: status `Not completed`, SIN ciphertext destroyed, household status `Not completed`; reopening the link starts a new claim.
- **`IWebhookSignatureVerifier`**, **`FakeWebhookSignatureVerifier`** (Infrastructure) — the real verifier per provider is deferred (ADR 0076).
- **`POST /learning-bond/webhooks/providers/{provider}`** (`LearningBondEndpoints`, anonymous, no `RequireModule`; the handler gates per organization), **`GET /g/learning-bond/{token}/applications/{id}/progress`**, **`POST .../applications/{id}/documents`**, **`POST .../documents/{id}/send`**, **`POST .../children/{childId}/pause`**, **`PUT .../children/{childId}/reminder`** — `LearningBondGuardianEndpoints`.

## Requirements

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-150` | `L1-027` | After submitting, the guardian shall see what was sent, to whom and what happens next, and shall be texted as the provider reports progress through a signed webhook applied once per event. |
| `L2-151` | `L1-027` | A claim that cannot go on shall pause with plain help, offer reminders at 14 and 30 days, resume from the same link where it stopped, and close as Not completed after 180 idle days. |
| `L2-021` | `L1-010` | Messages to guardians shall be composed and sent through the Messages module in the chosen channels. |
| `L2-022` | `L1-010` | Texts shall pause at the organization's monthly SMS cap while email continues. |
| `L2-034` | `L1-018` | Background jobs shall run per tenant, recover from failure and never send a message twice. |
| `L2-032` | `L1-017` | Every change and every sensitive view shall be recorded in the organization's audit log. |

## Diagrams

The provider calls back into PromiseHub; PromiseHub texts the guardian through the SMS provider.

![C4 system context for following progress](diagrams/c4-context.png)

The webhook enters the API without a guardian link; the job runner sends reminders per tenant.

![C4 container view for following progress](diagrams/c4-container.png)

Four handlers and one job share the application and claim records.

![C4 component view for following progress](diagrams/c4-component.png)

Applied event ids live on the application so a repeated event is a no-op.

![Class structure for following progress](diagrams/class-structure.png)

Signature, reference, tenant and module are checked before any status changes; the text goes through Messages.

![Sequence for a provider webhook](diagrams/sequence-provider-webhook.png)

A pause stores the step to resume at; reminders stop after the second text or on STOP.

![Sequence for pausing and resuming a claim](diagrams/sequence-pause-and-resume.png)
