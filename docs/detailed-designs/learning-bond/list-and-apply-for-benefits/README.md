# List and apply for benefits

## Overview

Once the benefits intake is saved, `learning-bond-benefits` lists each child benefit the household is likely entitled to, from a catalogue the platform maintains: federal and provincial entries for every province and territory, municipal ones where the organization's city matches. Each entry carries exactly one of Apply now, Need a document (with Upload) or Not eligible with a one-line reason; benefits the household already receives sit under You already get these. Apply now opens `learning-bond-benefit-review`, a pre-filled application with Edit per field and one Submit to {program}; the submission reuses the idempotent 202 path of the Learning Bond application (`../review-and-submit-application/README.md`). A program whose channel is a form the guardian sends offers the filled PDF, and marking it Sent is the guardian's act. There is no Submit all.

Terms used in this document:

- **catalogue entry** — `BenefitCatalogueEntry`: platform data with no organization id, versioned eligibility rule and estimate formula, source link, level, municipality, channel and renewal rule
- **benefit state** — one of `ApplyNow`, `NeedDocument`, `NotEligible` or `AlreadyReceived`, computed on the server from the facts and the rule
- **benefit application** — `LearningBondApplication` with `Kind = Benefit`, the program, the fields as sent, `ReviewVersion` and status

The catalogue is read without a tenant filter; every application, document and estimate carries the organization id from the link, and another household's benefit or application answers 404. Estimates computed, documents uploaded and submissions are audited by field name, never by amount or value, and no staff DTO carries a benefit name or dollar figure (ADR 0076).

## Description

Frontend:

- **`BenefitsPage`** (`learning-bond-benefits`) — one `ph-card` per entry with `ph-badge` for the state, the level and amount ("About $1,680 a year", "Amount varies"), the one-line reason, the source and rule version in a caption, and `ph-button` Apply now or Upload; `ph-alert` info "We don't know local programs for {city} yet." when no municipality matches; the all-received empty state "You're already getting every benefit we know about." with See your reminders; `ph-skeleton` while loading.
- **`BenefitDocumentDialog`** — `ph-dialog` with the file input for the named document; the upload binds the document to that benefit's application only.
- **`BenefitReviewPage`** (`learning-bond-benefit-review`) — the application review component shared with the Learning Bond review (every field with Edit, SIN as `Last3`), one `ph-button` Submit to {program}; for a PDF channel, Download the filled form (PDF), how to send it, and Mark as sent; `ph-alert` success after 202, danger "We couldn't send it. Nothing was sent. Try again." on failure.
- **`LEARNING_BOND_API`** — `listBenefits(token)`, `uploadBenefitDocument(token, benefitId, file)`, `getBenefitApplication(token, id)`, `updateBenefitField(token, id, field, value)`, `submitApplication(token, id, reviewVersion)`, `markSent(token, id)`.

Backend:

- **`BenefitCatalogue`** (`Domain/LearningBond/`) — `BenefitCatalogueEntry` rows seeded by the Cli with `RuleVersion`, `EligibilityRule`, `EstimateFormula?`, `SourceLink`, `Level`, `Province`, `Municipality?`, `Channel` (`Api` or `PdfForm`), `RenewalRule`; no organization edits it.
- **`ListBenefitsHandler`** — reads the household province from its address and the organization's city from Settings › Organization, selects the matching entries, evaluates each rule with `BenefitRuleEvaluator` against the decrypted facts in memory, answers `BenefitDto` (name, level, state, reason, estimated annual amount as a whole dollar, "Amount varies" counted as $0, rule version, source link, income-changed note). A child whose custody answer is The other parent or Not sure is left out of every entry. Each answer stores a `BenefitEstimate` with the rule version it used; a later rule version never rewrites it.
- **`UploadBenefitDocumentHandler`** — stores the file through `IFileStore` encrypted by `ILearningBondCipher` as a `LearningBondDocument` bound to one application; moves the state from `NeedDocument` to `ApplyNow`.
- **`PrepareBenefitApplicationHandler`** — builds the draft `LearningBondApplication` (`Kind = Benefit`) from the intake and the enrolment record, assigns `ReviewVersion`; `UpdateBenefitFieldHandler` edits one field and increments the version.
- **`SubmitApplicationHandler`** — the one handler of `../review-and-submit-application/README.md`: requires the current `ReviewVersion` (409), marks `Submitted`, records the idempotency key, then `IBenefitProgramChannel.SubmitAsync` with the fields and that application's documents only; a repeat answers the same 202; a refused channel resets `ReadyToSubmit`. `PdfForm` channels answer the filled PDF from `IBenefitFormRenderer`; `MarkSentHandler` sets `Submitted` on the guardian's request.
- **Endpoints** (`LearningBondGuardianEndpoints.cs`, behind `BenefitsConsentFilter`) — `GET /g/learning-bond/{token}/benefits`, `POST .../benefits/{benefit}/documents`, `GET .../applications/{id}`, `PATCH .../applications/{id}/fields/{field}`, `POST .../applications/{id}/submit`, `GET .../applications/{id}/form.pdf`, `POST .../applications/{id}/sent`.

## Requirements

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-155` | `L1-028` | Likely benefits shall come from a platform catalogue with versioned rules, estimated on the server by those rules and never by the language model. |
| `L2-156` | `L1-028` | Each benefit the family does not receive shall show exactly one of three states, and each application shall be submitted on its own. |
| `L2-032` | `L1-017` | Every change and every sensitive view shall be recorded in the organization's audit log and searchable by admins. |
| `L2-033` | `L1-018` | Guardian pages shall meet the performance budget measured on a mid-range phone over simulated 4G. |

## Diagrams

The guardian applies to each program one at a time; PromiseHub sends only what the guardian submitted.

![C4 system context for list and apply for benefits](diagrams/c4-context.png)

The catalogue is platform data in the same database; benefit programs sit behind `IBenefitProgramChannel`.

![C4 container view for list and apply for benefits](diagrams/c4-container.png)

The rule evaluator computes every amount; the handler depends on the channel abstraction, never on a program's SDK.

![C4 component view for list and apply for benefits](diagrams/c4-component.png)

Each estimate keeps the rule version it used, and each document belongs to one application.

![Class structure for list and apply for benefits](diagrams/class-structure.png)

Province and city select the entries; the rules decide the state and the amount.

![Sequence for listing benefits](diagrams/sequence-list-benefits.png)

One benefit is sent once with a 202, through the API channel or as a PDF the guardian sends and marks Sent.

![Sequence for submitting one benefit](diagrams/sequence-submit-one-benefit.png)
