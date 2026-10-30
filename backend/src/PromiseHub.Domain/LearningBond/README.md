# LearningBond

Domain types for the Learning Bond module (ADR 0076, L1-026 to L1-029). Prompt 82 lays the foundation; later prompts add the claim, consent, application and benefit records.

- `LearningBondAgreement` — a platform-owned version of the data-handling agreement; no organization id.
- `LearningBondAgreementAcceptance` — one organization's acceptance of one agreement version, by a named member.
- `EncryptedSin` — a social insurance number as ciphertext and its last three digits; never the clear text (L2-159).
- `SocialInsuranceNumber` — validates the nine digits and check digit before anything is encrypted.
- `LearningBondIntake` — a household's intake, holding the guardian's encrypted SIN until it is destroyed.
