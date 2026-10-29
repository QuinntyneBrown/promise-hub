# Review and submit the application

## Overview

`learning-bond-review` recommends a no-fee RESP provider from the platform's list, shows every field of the pre-filled application with Edit per field, and offers Submit to {provider} as the only way to send it. Nothing reaches the provider or a government service before the guardian taps Submit: the fake channel used in tests records no request before that moment. Submit carries the review's version, requires a trusted device, answers 202 and sends once; a double tap or a retry answers the same 202 and sends nothing more. A provider that refuses or cannot be reached leaves the application `ReadyToSubmit` with "We couldn't send it. Nothing was sent. Try again."

Terms used in this document:

- **provider catalogue** — `RespProviders`: platform rows with `Name`, `NoFee`, `AdministersLearningBond`, `Provinces`, `Channel`, `ProcessingDays`; identical for every organization and editable by no organization
- **recommendation** — first catalogue entry whose `Provinces` include the household's province, with the fixed reason "No fees, no deposit needed, and it handles the Learning Bond"
- **review version** — `LearningBondApplication.ReviewVersion`, incremented by every edit and every provider change; Submit shall quote the current value
- **idempotency key** — `LearningBondApplication.SubmissionKey`, written before the channel is called so a repeat finds it and sends nothing

Every route resolves the tenant through `GuardianAccess` and answers 404 when the module is off. Preparing, editing, choosing a provider and submitting are audited; the submission entry is `LearningBondApplicationSubmitted` with the application id, provider and `ReviewVersion`, and no audit entry, log or DTO carries a SIN (`L2-032`, `L2-159`). The guardian DTO carries both SINs as `Last3` only.

## Description

Frontend:

- **`LearningBondReviewPage`** (`frontend/projects/learning-bond/`, route `/g/learning-bond/:token/review`) — `ph-card` RESP provider with the name, `ph-badge` Recommended, the reason sentence and Choose another, which swaps in a `ph-radio-group` of every catalogue entry serving the province; `ph-card` RESP and Learning Bond application as a facts list with `ph-button` Edit on every field except the two masked SINs and the provider; an Edit opens a `ph-dialog` with one `ph-text-field` validated on save (`L2-011` rules) and the help "For this application only. Your household record isn't changed."; the line "This sends {first name}'s application to {provider} and the Government of Canada." above `ph-button` Submit to {provider} with a busy state that ignores a second tap; `ph-alert` danger for the failed send; the no-provider state shows the Government of Canada link and no Submit.
- **`LEARNING_BOND_API.prepareApplication(token, childId)`**, **`chooseProvider(token, applicationId, providerId)`**, **`editField(token, applicationId, field, value)`**, **`submit(token, applicationId, reviewVersion)`**.

Backend:

- **`LearningBondApplicationHandler.PrepareAsync`** (`PromiseHub.Application/LearningBond/`) — scope, module gate, trusted device, active consent, estimate present. Creates or reloads the child's `Draft` `LearningBondApplication` of kind `LearningBond`: beneficiary name and date of birth from `Child`, caregiver name, address, phone, email and language from `Household` and `Guardian`, both SINs by reference to the stored `EncryptedSin` values (never copied in clear), and the recommended `RespProvider`. With no provider serving the province the application stays absent, the claim stays `Started`, and the DTO carries `NoProvider = true` with the Government of Canada link (`L2-148` criterion 2).
- **`LearningBondApplicationHandler.EditFieldAsync`** — validates address, phone and email exactly as the household record does (`HouseholdRules`, 422 with the same messages), stores the value on the application only, increments `ReviewVersion`, audits `LearningBondApplicationEdited(field)`. `Household` is unchanged (`L2-148` criterion 4). **`ChooseProviderAsync`** sets the provider from the catalogue and increments `ReviewVersion`; the application moves to `ReadyToSubmit` when every field is present.
- **`SubmitApplicationHandler.SubmitAsync`** — requires `ReviewVersion` equal to the stored one and a trusted device, else 409 and nothing sent. When `SubmissionKey` already exists, answers 202 with the stored result and calls nothing (`L2-149` criterion 3). Otherwise, in one save: status `Submitted`, `SubmittedAt`, `SubmissionKey`; then `ILearningBondCipher.Decrypt` for both SINs in memory, the payload for `IRespProviderChannel.SubmitAsync`, and the provider's reference stored as `ProviderReference`. The only decrypting call site in the module is this method. `Unavailable` from the cipher answers 503 "Learning Bond is unavailable right now. Nothing was lost." before the status changes. A `Refused` or `Unreachable` result resets `ReadyToSubmit`, clears `SubmissionKey` and answers 502 `not-sent`; a retry sends once (`L2-149` criterion 5).
- **`IRespProviderChannel`** (`Application/LearningBond/`), **`FakeRespProviderChannel`** (`Infrastructure/LearningBond/`) — the fake records every call so tests assert zero calls before Submit and one after; a real channel is deferred (ADR 0076).
- **`LearningBondAgent`** — tools `GetStatus`, `GetEstimate`, `ListBenefits`, `ExplainStep`, `OfferCallback`; no tool reaches `SubmitApplicationHandler` (`L2-149` criterion 4).
- **`POST /g/learning-bond/{token}/children/{childId}/applications`** (prepare), **`PATCH /g/learning-bond/{token}/applications/{id}/fields/{field}`**, **`PUT /g/learning-bond/{token}/applications/{id}/provider`**, **`POST /g/learning-bond/{token}/applications/{id}/submit`** — `LearningBondGuardianEndpoints`.

## Requirements

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-148` | `L1-027` | The system shall recommend the first no-fee provider serving the household's province from a platform list no organization can change, and pre-fill its application for field-by-field review. |
| `L2-149` | `L1-027` | The server shall send an application to a provider only on the guardian's own Submit request with the review's current version, exactly once, and never on the agent's. |
| `L2-032` | `L1-017` | Every change and every sensitive view shall be recorded in the organization's audit log. |
| `L2-011` | `L1-005` | Household and child records shall validate contact details on the server and keep an audit trail. |

## Diagrams

The RESP provider is the only external recipient, and only after Submit.

![C4 system context for review and submit](diagrams/c4-context.png)

The provider channel sits behind an abstraction with a fake in tests.

![C4 container view for review and submit](diagrams/c4-container.png)

Two handlers: one prepares and edits, one submits and decrypts.

![C4 component view for review and submit](diagrams/c4-component.png)

The application stores its own copy of the contact fields and references the encrypted SINs.

![Class structure for review and submit](diagrams/class-structure.png)

The recommendation is the first catalogue match; edits touch the application only.

![Sequence for reviewing the application](diagrams/sequence-review.png)

Status and the idempotency key are saved before the channel is called; a failure rolls the status back.

![Sequence for submitting the application](diagrams/sequence-submit.png)
