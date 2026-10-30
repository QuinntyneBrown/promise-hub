# Gate the Learning Bond module

## Overview

Learning Bond is the twelfth module (`ModuleId.LearningBond`). It is off for every organization until an admin turns it on in `settings-modules`, and the server refuses the save unless Roster and Messages are on and the current data-handling agreement has been accepted for that organization. While it is off, every `/learning-bond` staff endpoint, every `/g/learning-bond/{token}` guardian endpoint and every webhook answers 404 for that organization, the frontend never loads the `learning-bond` library and its routes redirect to Today. Turning it off deletes nothing; turning it back on restores every claim, consent and figure (ADR 0076).

Terms used in this document:

- **module gate** — `RequireModule(ModuleId.LearningBond)` on an endpoint group, answered from the tenant's `ModuleConfiguration` through `IModuleGate`
- **agreement gate** — `LearningBondAgreementGate`: the rule that the current `LearningBondAgreement` version has a `LearningBondAgreementAcceptance` for the organization
- **tenant** — organization of the signed-in member's active membership, of the guardian link, or of the stored application a webhook names; never a value from the client

Settings › Learning Bond (`settings-learning-bond`) is the hub that the other five designs of this subsystem open from.

## Description

Frontend:

- **`SettingsModulesPage`** (`frontend/projects/settings/`) — existing page; `MODULE_CATALOG` gains Learning Bond last with "Claims every dollar the government already owes your child, from birth to university." and the caption "Needs Roster and Messages". The 422 body maps to `ph-error-summary` and the inline error beside the switch: "Learning Bond needs Messages." (state `learning-bond-needs-messages`), "Learning Bond needs the roster." or "Accept the Learning Bond data-handling agreement first." with a Read the agreement link to `learning-bond-agreement` (state `learning-bond-agreement`).
- **`ModulePresetTilesComponent`** (`onboard-modules`) — unchanged presets; "Let me choose" shows the same row. No preset turns Learning Bond on.
- **`SettingsLearningBondPage`** (`frontend/projects/learning-bond/`, `settings-learning-bond`) — four `ph-card`s (agreement, coverage, invitation, launch), each linking to its page; `ph-alert` (warning) when a new agreement version is pending; `ph-skeleton` while loading; the forbidden state for roles without `ManageSettings`. Reads `LEARNING_BOND_API.getOverview()`.
- **Shell** (`frontend/projects/promisehub/`) — the `/learning-bond/**` routes and the Settings tab are composed only when the module is on in the session's configuration; otherwise the route redirects to Today and `learning-bond` is never downloaded (L2-005, L2-162).

Backend:

- **`ModuleId.LearningBond`**, **`ModuleCatalog.Name`** ("Learning Bond") and **`ModuleCatalog.Needs`** ([Roster, Messages]); `ModuleCatalog.Suite` is unchanged. `ModuleRules.Check` already renders "Learning Bond needs Messages." and names Learning Bond among Roster's dependents (L2-135 criteria 2 and 3).
- **`LearningBondAgreementGate`** (`PromiseHub.Application/LearningBond/`) — `IsAcceptedAsync()`: true when the current `LearningBondAgreement` version has an acceptance for the tenant. **`SaveModulesHandler`** calls it when the set turns Learning Bond on and adds a `ModuleViolation` for `LearningBond` with "Accept the Learning Bond data-handling agreement first." (criterion 4). The ADR names this check `SaveModuleConfigurationCommandValidator`; the built handler is `SaveModulesHandler` with `ModuleRules`, so the check lives there.
- **`LearningBondEndpoints`** (`PromiseHub.Api/Endpoints/`) — group `/learning-bond` with `RequireModule(ModuleId.LearningBond)`. The agreement routes (`/learning-bond/agreement/**`, `accept-data-handling-agreement`) are the one exception: they require `ManageSettings` and Roster and Messages on, because the agreement is accepted before the module can be on.
- **`LearningBondGuardianEndpoints`** — group `/g/learning-bond/{token}`; `GuardianAccess.ResolveAsync` puts the request in the link's organization, then `IModuleGate.IsOnAsync(ModuleId.LearningBond)` answers 404 when off. Webhooks take the organization from the stored `LearningBondApplication` and check the gate the same way.
- **`GetLearningBondOverviewHandler`** — the hub's DTO: agreement version and acceptance, pending version, coverage summary, sender name and launch state. Counts only; no household record is read before invitations go out (L2-136 criterion 5).
- **Jobs** — `LearningBondLaunchJob`, `LearningBondReminderJob` and `LearningBondDestructionJob` (`PromiseHub.Infrastructure/LearningBond/`) run per tenant inside `TenantScope` and exit when the module is off or the organization is suspended.
- **Audit** (L2-161, L2-032) — `SaveModulesHandler` already records `ModuleChanged` with before and after. Every Learning Bond handler records its own entry through `IAuditWriter` with actor, organization, record, action and time; entries name fields, never values. A cross-tenant request by id answers 404 and is audited as `Denied`.
- **Seed** — Harbourview has Learning Bond on with an accepted agreement version and claims in several statuses; Northgate has it off.

Tenant and module gate: every Learning Bond table carries `OrganizationId` under the tenant filter; a request from another organization, or while the module is off, answers 404 and never confirms that a record exists. Staff DTOs carry statuses, counts and dates only, never a SIN, income, marital status, household size, benefit name or dollar amount of a family.

Encrypted store (L2-159, ADR 0076): `EncryptedSin` (Domain) is the ciphertext and the last three digits, with `Masked` ("*** *** 123") as its only string form; `SocialInsuranceNumber.Normalize` refuses a value that is not nine digits with a valid check digit, without repeating it. `ILearningBondCipher` (Application) is implemented by `LearningBondCipher` (Infrastructure `LearningBond/`): AES-256-GCM under `LearningBond:Key` (32 bytes, base64, from configuration or a key vault, never the database), a fresh nonce per value and a ciphertext bound to its purpose; with no usable key it is unavailable and encrypts nothing. `LearningBondIntake` holds the guardian's SIN as two columns. `LearningBondSinDestroyer` drops the ciphertext, keeps the last three digits and audits "Learning Bond: guardian SIN destroyed; last three digits kept" as System.

Open questions: none. Decisions taken while building (prompt 82):

- The staff module check is `GET /learning-bond`, answering `{ on: true }` while the module is on and 404 otherwise; it is what later staff screens build on.
- The guardian door is `GET /g/learning-bond/{token}`, answering `{ organization, language }`; until the launch (prompt 85) mints dedicated Learning Bond links, any household link resolves. Every refusal (unknown or revoked link, suspended organization, module off) is the same bare 404, and opening a link while the module is off is audited as `AccessDenied` on `LearningBondLink` by "Guardian" for the link's organization.
- The frontend shows the 404 with the app's `LearningBondUnavailablePage` (as `SiteNotFoundPage` does for the public website), so the `learning-bond` library is never downloaded; the page names no organization because the 404 carries none.
- Settings › Modules shows every module a module needs while it is off ("Needs Roster and Messages") and only those still off while it is on.
- The audit search also matches record types written without spaces, so "Learning Bond" finds `LearningBond…` records; the module change entry adds "Learning Bond turned on" or "turned off".
- The agreement is seeded as version 2 (effective 1 October 2026) with Harbourview's acceptance by Tom; reading and accepting it is prompt 83, which also adds the Read the agreement link beside the switch.

Deferred: webhooks (`/learning-bond/webhooks/**`) arrive with the applications they name (prompt 86); `LearningBondDestructionJob` and its daily schedule arrive with the claims and applications whose status triggers it (prompts 86 and 88); the claims in several statuses of the seed arrive with the claim (prompt 86).

## Built so far

Prompt 82 delivered the module end to end with no screen of its own: `ModuleId.LearningBond` with its name and needs, the agreement gate in `SaveModulesHandler`, `LearningBondEndpoints` and `LearningBondGuardianEndpoints`, `LearningBondGuardianHandler`, the encrypted store above, the audit entries, migration `LearningBondFoundation` (`LearningBondAgreements`, `LearningBondAgreementAcceptances`, `LearningBondIntakes`) and the seed (Harbourview on with the agreement accepted, Northgate off). Frontend: `MODULE_CATALOG` and Settings › Modules, the empty `learning-bond` library with its staff and guardian route tables, `LEARNING_BOND_API` with `HttpLearningBondApi`, the shell's module route and link guard, and the fake API in `e2e/fixtures/fake-learning-bond.ts`. Acceptance tests: `backend/tests/PromiseHub.Api.Tests/LearningBondModuleTests.cs`, `backend/tests/PromiseHub.Api.Tests/LearningBondAuditTests.cs`, `backend/tests/PromiseHub.Infrastructure.Tests/LearningBondCipherTests.cs`, `backend/tests/PromiseHub.Infrastructure.Tests/LearningBondSinStorageTests.cs` and `e2e/tests/learning-bond/module-gate.spec.ts`.

## Built in prompt 83

- `LearningBondOverviewHandler` answers `GET /learning-bond/overview` (the hub): agreement version, latest acceptance, `pendingVersion` and its effective date, coverage with the chosen programs' names and the households reached, status roles, sender name, languages and `launchBlocked` ("A new version of the agreement needs accepting." while a version is pending). Launch itself is prompt 85, so the Launch card offers no action yet beyond the disabled button.
- `SettingsLearningBondPage` (`frontend/projects/learning-bond/`, `/settings/learning-bond`) with its own Settings tabs: `settingsSections(modules)` in the api library adds the Learning Bond tab only while the module is on, and every Settings page reads it from the session (ADR 0077). The hub, coverage and invitation are lazy-loaded through `moduleRoute('settings/learning-bond', 'LearningBond')`; the agreement through `moduleRoute('settings/learning-bond/agreement', ['Roster', 'Messages'])` from the settings library.
- Acceptance tests: `backend/tests/PromiseHub.Api.Tests/LearningBondInvitationTests.cs` (overview and new version) and `e2e/tests/learning-bond/hub.spec.ts`.

## Requirements

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-135` | `L1-026` | Learning Bond shall be the twelfth module, needing Roster and Messages, off until an admin turns it on, and shall not turn on before the data-handling agreement is accepted. |
| `L2-162` | `L1-029` | Every Learning Bond record shall carry the organization id, the tenant shall come from the membership or the guardian link, and every endpoint shall answer 404 when the module is off or the record belongs to another organization. |
| `L2-161` | `L1-029` | Every Learning Bond action that changes or reveals something shall be audited with actor, organization, record, action and time, without the sensitive values. |
| `L2-004` | `L1-002` | Admins shall switch modules on or off in `settings-modules` or by a preset in `onboard-modules`, with dependencies declared and enforced on the server. |
| `L2-005` | `L1-002` | A module that is off shall be neither served nor rendered. |
| `L2-001` | `L1-001` | Every query shall filter by the organization of the active membership, never by a value from the client. |
| `L2-032` | `L1-017` | Every change and every sensitive view shall be recorded in the organization's audit log. |

## Diagrams

The admin turns the module on; the server checks dependencies and the agreement before anything is stored.

![C4 system context for gating the Learning Bond module](diagrams/c4-context.png)

The Angular app composes navigation from the configuration it reads once per session; the API reads the same configuration on every request.

![C4 container view for gating the Learning Bond module](diagrams/c4-container.png)

The agreement gate is consulted by the module save; the module gate is consulted by every Learning Bond endpoint and job.

![C4 component view for gating the Learning Bond module](diagrams/c4-component.png)

The configuration stores only the modules that are on, so Learning Bond is off for every existing organization.

![Class structure for gating the Learning Bond module](diagrams/class-structure.png)

Saving the configuration is refused twice before it succeeds: once for Messages and once for the agreement.

![Sequence for saving the module configuration](diagrams/sequence-save-module-configuration.png)

A request while the module is off answers 404 from the gate, whichever door it came through.

![Sequence for a request while the module is off](diagrams/sequence-request-while-off.png)
