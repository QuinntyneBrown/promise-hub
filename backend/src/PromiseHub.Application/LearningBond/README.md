# LearningBond

Handlers and ports for the Learning Bond module (ADR 0076, L1-026 to L1-029). Prompt 82 adds the foundation every later prompt builds on:

- `LearningBondAgreementGate` — whether the current agreement version is accepted for the tenant; `SaveModulesHandler` asks it before turning the module on.
- `LearningBondGuardianHandler` — resolves a guardian link to its organization and answers only while Learning Bond is on there.
- `ILearningBondCipher` — encrypts a SIN under the Learning Bond key held outside the database; `LearningBondUnavailableException` when the key is missing.
- `LearningBondSinDestroyer` — destroys a SIN's ciphertext, keeps the last three digits and audits it without the value.
