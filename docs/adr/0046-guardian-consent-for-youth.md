# 0046: Guardian consent is a verified-link guardian page, the consent age and wording are a privacy setting, and the gate is an endpoint filter on youth work

- Status: accepted
- Date: 2026-10-26

## Context

Prompt 52 ports Waypoint's guardian consent (`L2-CONSENT-001`, `-002`, `-004`, `L2-GUARDIAN-003`) as `L2-055` to `L2-058`. Waypoint has guardian accounts, a `GuardianConsent` row per youth user with media options, a term-scoped validity window and a one-time `GuardianConsentRequest` link sent by email. PromiseHub has no guardian accounts (`L1-013`): guardians reach pages by links with a six-digit code (ADR 0015). Youth accounts link to a child record (ADR 0043, ADR 0045).

## Decision

- **Link.** A consent link is a `GuardianLink` with `ForConsent` set, the household and the child; it lives 30 days. Issuing one revokes the child's earlier consent links. The code, device trust and the tenant come from the link exactly as for slips (ADR 0015). Home, slip and survey endpoints refuse consent links and the consent endpoints refuse every other link (410).
- **Who asks.** The youth asks from the gate (`POST /learning/consent-request`, Learning, `Learn`) and admins and program directors send from the child record (`POST /children/{id}/consent-request`, Roster, `WriteHouseholds`). The link goes to every guardian of the household who may sign: a text to a mobile, otherwise an email to a working address, in the household language, straight to the provider (not counted against the SMS cap, like codes). A second request within 10 minutes sends nothing and answers the same contacts.
- **Record.** `GuardianConsent` (tenant-owned) keeps the child, the household, the guardian's name as on file, the relationship, the time, the device, the household language, the wording as shown and its SHA-256, a reference `GC-XXXXXX` and, after a withdrawal, who and when. A consent is in force until withdrawn; a new consent after a withdrawal is a new row. Signing needs a typed name that matches a guardian of the household who may sign, as slips do. A copy is emailed to the signer when they have a working email.
- **Policy.** `ConsentPolicy` (tenant-owned, optional) holds the consent age (13 to 19, default 18) and the wording (20 to 2,000 characters, with a default). `GET`/`PUT /settings/consent` under `ManageSettings` and Roster; shown as its own card on Settings › Privacy and data and edited in a dialog. Saving is audited.
- **Required.** Consent is required for a child who has an active youth account and whose age is under the consent age; a child with no date of birth counts as under it. It is evaluated on every request, so changing the age or a birthday takes effect at once.
- **Gate.** `RequireGuardianConsent()` is an endpoint filter that answers 403 `consent-required` when the caller is a Youth whose linked child needs consent and has none in force. It is applied to every Learning endpoint that returns youth work; the first is the placeholder `GET /learning/lessons` (an empty list until prompt 57). `GET /learning/me` and the consent request stay open so the gate can explain itself. The Learning page reads the lessons endpoint and renders the `consent-required` state on that 403.
- **Withdrawal.** `POST /g/consent/{token}/withdraw` sets the withdrawal on the consent in force; the youth is gated on their next request; the record is kept. Grants, withdrawals and requests are audited on `GuardianConsent` (new audit action `Withdrawn`).

## Consequences

- Media and photo consent with Waypoint's granular options, emailing another copy on request, re-consent each term, staff notifications on withdrawal and retention of consent records under the privacy retention job are deferred (prompts 73, 54, 79).
- Every later Learning endpoint that returns youth work adds `RequireGuardianConsent()` next to `RequireModule(ModuleId.Learning)` and `RequirePermission(Permission.Learn)`.
- Mentoring and messaging journeys that put a youth in contact with an adult apply the same filter when they arrive.
