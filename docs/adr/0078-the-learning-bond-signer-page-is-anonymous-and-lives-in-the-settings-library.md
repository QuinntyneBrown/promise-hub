# 0078: The Learning Bond signer page is anonymous and lives in the settings library

- Status: accepted
- Date: 2026-10-30

## Context

Prompt 84 builds the named signer's own page (`L2-137`): a board chair or executive director with no PromiseHub account opens a single-use emailed link, reads the data-handling agreement and accepts it for the organization. ADR 0077 left open whether the page lives in the app's guardian shell or the settings library. The page is shown while Learning Bond is off, because the agreement has to be accepted before the module can be on, so it cannot live in the `learning-bond` library, which is downloaded only while the module is on. The signer is not a guardian: the link names no household, so the guardian link resolver (`GuardianAccess`) and the `guardian` library's household pages do not fit. The signer has no session, so nothing about the organization's modules is known before the server answers the link.

## Decision

- **The page lives in the `settings` library, next to the agreement page.** `LearningBondSignerPage` reads and accepts through `LEARNING_BOND_API` (`getSignerAgreement(token)`, `acceptAsSigner(token, authority)`) and is composed of `ph-guardian-shell`, `ph-card`, `ph-checkbox`, `ph-error-summary`, `ph-alert` and `ph-button`. The settings library exports it as `signerRoutes`.
- **The app mounts it anonymously at `/sign/learning-bond/:token`**, outside the signed-in shell and its module guards, like the guardian pages. Opening it downloads the settings library's signer chunk only, never `learning-bond`.
- **The server resolves the link, not the client.** `SignerLinkAccess` finds the request by the token's hash across organizations, then resolves the tenant from it (`TenantContext.ResolveForSigner`, actor "Signer: {name}"), so every later query runs inside the tenant filter. The endpoints `GET /sign/learning-bond/{token}` and `POST /sign/learning-bond/{token}/acceptances` are anonymous by explicit opt-in and outside the Learning Bond module gate.
- **One answer for every dead link.** A used, expired, cancelled or replaced link, and one whose organization is suspended, answers 410 with "This link has expired. Ask {organization} to send a new one."; an unknown token answers 404 and the page says the same words without naming an organization.

## Consequences

- The settings library has three Learning Bond screens (agreement, signer dialog, signer page); none assumes the module is on and none reads a household.
- `TenantContext` gains a signer resolution beside the guardian, visitor and job ones.
- The requesting admin is notified in the app (`learning-bond-agreement-signed`) and by email; the notice links to the agreement page, which works whether the module is on or off.
