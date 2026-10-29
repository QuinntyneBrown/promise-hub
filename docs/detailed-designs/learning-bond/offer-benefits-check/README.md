# Offer the benefits check

## Overview

After a Learning Bond application is sent, the agent offers to check child benefits (`learning-bond-submitted`, dialog `learning-bond-benefits-offer`): "I can also check whether your family gets every child benefit it qualifies for. It takes about 3 questions." Check benefits opens a consent of its own, with the Benefits wording and a typed name, stored as a `LearningBondConsent` with scope `Benefits` and never counted as a Learning Bond consent. Not now is remembered and the offer stays on `guardian-learning-bond`; a household with no claim to start sees the offer there directly. Without a Benefits consent every benefits endpoint of the household answers 403. The intake (`learning-bond-benefits-intake`) reuses the Learning Bond intake and asks at most three facts: household size, marital status and the Canada Child Benefit now, plus the income-changed question and, for Separated or Divorced, who claims each child.

Terms used in this document:

- **Benefits consent** — `LearningBondConsent` with `Scope = Benefits`: guardian, typed name, wording version, language, time
- **benefits facts** — household size, marital status, Canada Child Benefit now, income changed and the custody answer per child, stored encrypted on `LearningBondIntake`
- **custody branch** — the who-claims question asked only for Separated or Divorced, answered per child

The guardian link resolves the organization through `GuardianAccess` and then the module gate; another household's intake or a module that is off answers 404. Consents given, Not now and intake saves are audited with the field names, never the values (ADR 0076).

## Description

Frontend:

- **`BenefitsOfferCard`** on `learning-bond-submitted` and `guardian-learning-bond` — `ph-card` with the agent's sentence, `ph-button` Check benefits and Not now; Not now calls `LEARNING_BOND_API.declineBenefitsOffer(token)` and the card stays on the family page.
- **`BenefitsConsentDialog`** (`learning-bond-benefits-offer`) — `ph-dialog` with `ph-checkbox` carrying the Benefits wording, `ph-text-field` typed name (`autocomplete="name"`), `ph-error-summary`; Agree and check posts the consent and navigates to the intake.
- **`BenefitsIntakePage`** (`learning-bond-benefits-intake`) — `ph-text-field` household size (`inputmode="numeric"`, 1 to 15), `ph-radio-group` marital status (six values), Canada Child Benefit now (Yes, No, Not sure), income changed (Yes, No), and, when the status is Separated or Divorced, one `ph-radio-group` per child (Me, The other parent, We share, Not sure); `ph-alert` warning for the stopped child with I'd rather talk to someone (`learning-bond-callback`). Nothing the Learning Bond intake already holds is shown again.
- **`LEARNING_BOND_API`** — `giveConsent(token, BenefitsConsentRequest)`, `declineBenefitsOffer(token)`, `saveBenefitsIntake(token, BenefitsIntakeRequest)`; every DTO carries `Last3` only.

Backend:

- **`GiveConsentHandler`** — stores a `LearningBondConsent` with `Scope = Benefits`, the wording version from `LearningBondTexts`, the household language and the typed name; it never reuses `GuardianConsent` nor a `LearningBond` scope; audits Consent given.
- **`DeclineBenefitsOfferHandler`** — records `BenefitsOfferDeclinedAt` on `LearningBondIntake` so the offer is not shown on `learning-bond-submitted` again; the card on `guardian-learning-bond` remains.
- **`BenefitsConsentFilter`** — endpoint filter on every `/g/learning-bond/{token}/benefits*` route; no Benefits consent for the household answers 403 and no benefit question is asked (`L2-153` criterion 3).
- **`SaveBenefitsIntakeHandler`** — validates household size 1 to 15 ("Enter how many people live with you, from 1 to 15."), marital status and Canada Child Benefit in their lists ("Choose one."), 422 per field; writes the benefits facts through `ILearningBondCipher`; records `IncomeChanged` so every estimate carries "These estimates use your last tax return. A big change this year can change them."; for Separated or Divorced stores `ClaimedBy` per child. Not sure marks the child `CheckStopped` with "We can't check benefits for {first name} until it's clear who claims them. Staff can help."; The other parent excludes the child from every benefit answered to this guardian. Audits Intake saved naming the fields.
- **`BenefitsOfferPolicy`** — decides where the offer appears: on `learning-bond-submitted` after a submission, and on `guardian-learning-bond` when no claim can start (every child over 15 or born before 2004) once a per-child consent of `L2-145` exists.
- **Endpoints** (`LearningBondGuardianEndpoints.cs`) — `POST /g/learning-bond/{token}/consents` (scope `Benefits`), `POST /g/learning-bond/{token}/benefits/offer/decline`, `PUT /g/learning-bond/{token}/benefits/intake`.

## Requirements

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-153` | `L1-028` | The agent shall offer the benefits check on the Learning Bond confirmation, and benefit data shall need a consent of its own, recorded separately from the Learning Bond consent. |
| `L2-154` | `L1-028` | The benefits intake shall reuse the children, birth dates, SINs and tax-filing status already given and ask at most three facts more. |
| `L2-055` | `L1-013` | A guardian shall consent through a verified link, with no account, by reading the wording, ticking the box and typing their name. |
| `L2-032` | `L1-017` | Every change and every sensitive view shall be recorded in the organization's audit log and searchable by admins. |

## Diagrams

The guardian consents to the benefits check from a text link; the catalogue and the language model stay outside this feature.

![C4 system context for offer the benefits check](diagrams/c4-context.png)

The Angular guardian pages call the guardian endpoints, which resolve the household through the link before the module gate.

![C4 container view for offer the benefits check](diagrams/c4-container.png)

The consent filter sits in front of every benefits route; the handlers write only through the cipher.

![C4 component view for offer the benefits check](diagrams/c4-component.png)

The Benefits consent is a scope of `LearningBondConsent`, and the benefits facts live on the household's single `LearningBondIntake`.

![Class structure for offer the benefits check](diagrams/class-structure.png)

Not now is remembered, Check benefits records a separate consent, and until it exists the benefits routes answer 403.

![Sequence for the offer and consent](diagrams/sequence-offer-and-consent.png)

The intake asks three facts, then the custody branch for Separated or Divorced; Not sure stops the check for that child.

![Sequence for the benefits intake](diagrams/sequence-benefits-intake.png)
