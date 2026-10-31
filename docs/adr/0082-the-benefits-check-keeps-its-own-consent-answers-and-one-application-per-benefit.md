# 0082: The benefits check keeps its own consent, its answers encrypted, and one application per benefit

- Status: accepted
- Date: 2026-10-30

## Context

Prompt 89 adds the benefits check after the Learning Bond (`L2-153` to `L2-156`). The design named a seeded `BenefitCatalogueEntry` table, a benefits consent, an intake reusing the Learning Bond answers, and an application per benefit sent like the Learning Bond one. ADR 0080 already keeps the RESP provider list in code. The codebase has no PDF library. A form that a program takes on paper would need a SIN in clear text to be truly pre-filled, and `L2-159` never shows more than the last three digits.

## Decision

- **The catalogue is a static list in code.** `BenefitCatalogue.All` holds a federal Canada Child Benefit and Child Disability Benefit, a child benefit for every province and territory, and Hamilton Recreation Assistance. Each entry has its level, its province or municipality, its channel, its source and link, and a rule version with its effective date. The rule gives the amount per child by age, null when the amount varies, plus "already gets", "not eligible" with a reason, and a document needed first. The province comes from the organization's time zone (ADR 0080) and the municipality from its city. An application records the rule version it was prepared under.
- **The Benefits consent has its own scope, per child.** It is one `LearningBondConsent` per child under 18 with scope `Benefits` and its own wording. It never starts a claim and never counts as a Learning Bond consent. Every benefits endpoint answers 403 without it.
- **The answers are one encrypted record per household.** `LearningBondBenefitsCheck` keeps Not now and the intake's answers (household size, marital status, the Canada Child Benefit, income changed, who claims each child). The answers are stored as ciphertext through `ILearningBondCipher` under the document purpose, so neither the database nor a log holds them in clear.
- **Each benefit has its own application.** `LearningBondBenefitApplication` is unique per household and benefit.
  - An electronic program is sent by Submit once through `IBenefitChannel`, with the review version and a submission key, as in ADR 0080. Until a program is integrated, `UnconfiguredBenefitChannel` answers not sent.
  - A form program gets a one-page PDF written without a library (`LearningBondFormPdf`). Its SIN boxes are left blank, with the last three digits as a reminder. The guardian marks it sent; PromiseHub sends nothing.
  - A document a program needs is a `LearningBondDocument` on that application, encrypted, and only ever attached to it.

## Consequences

- Adding a program or changing an amount is a code change with a new rule version.
- Estimates are upper amounts by age, since PromiseHub does not ask for income. The page says they use the last tax return.
- A guardian sending a paper form copies the SIN in by hand. PromiseHub never prints it.
