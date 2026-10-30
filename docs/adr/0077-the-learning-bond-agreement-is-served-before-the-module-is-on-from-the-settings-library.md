# 0077: The Learning Bond agreement is served before the module is on, from the settings library

- Status: accepted
- Date: 2026-10-30

## Context

Prompt 83 builds the admin's "Turn on Learning Bond" journey. `L2-135` criterion 4 refuses to turn Learning Bond on until the current data-handling agreement is accepted, so the agreement has to be read and accepted while the module is still off. ADR 0076 already lets the agreement endpoints (`/learning-bond/agreement/**`) skip the Learning Bond gate, requiring `ManageSettings` with Roster and Messages on. The frontend has no such exception: `AGENTS.md` says each feature library maps to exactly one module and is lazy-loaded only while that module is on, so a page in the `learning-bond` library cannot be shown while Learning Bond is off. The mocks place the agreement at `/settings/learning-bond/agreement` and the hub `settings-learning-bond` has a `not-accepted` state with the module on and no acceptance, which the server rule makes impossible.

## Decision

- **The agreement page and the signer dialog live in the `settings` library.** `LearningBondAgreementPage` and `LearningBondSignerDialog` are Settings pages, like the module defaults cards of ADR 0073, and use `LEARNING_BOND_API` from the api library. The shell mounts them at `/settings/learning-bond/agreement` behind `moduleRoute(['Roster', 'Messages'])`, before the Learning Bond routes, so they load while Learning Bond is off and redirect to Today while Roster or Messages is off. The `learning-bond` library is still downloaded only while Learning Bond is on.
- **Hub, coverage and invitation stay in the `learning-bond` library** behind the module gate on both sides: `/settings/learning-bond`, `/settings/learning-bond/coverage` and `/settings/learning-bond/invitation`, and `GET /learning-bond/overview`, `/learning-bond/settings` and `/learning-bond/invitation`.
- **Settings › Modules is the way in while the module is off.** Its refusal "Accept the Learning Bond data-handling agreement first." carries Read the agreement. After accepting while off, the agreement page offers Turn on Learning Bond (mock state `learning-bond-agreement/accepted-off`); while on, it offers Choose coverage and Back to Learning Bond. The hub's `not-accepted` state is removed from the mocks.
- **The Settings tabs gain Learning Bond only while it is on.** `settingsSections(modules)` in the api library composes the tabs from the session's modules, so the settings pages and the hub render one list.
- **Resend mints a new link.** The signer's token is stored only as a hash, so Resend sends a new single-use link and the earlier one stops working, rather than re-sending the same address.

## Consequences

- The settings library gains two Learning Bond screens; nothing in it assumes the module is on, and they read only the agreement, never a household.
- `docs/detailed-designs/learning-bond/accept-data-handling-agreement` and `gate-learning-bond-module` name the settings library for these screens.
- The signer's own page (`/sign/learning-bond/{token}`, prompt 84) lives in the guardian shell of the app or the settings library for the same reason; prompt 84 decides which.
