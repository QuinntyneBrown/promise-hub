# 0015: Guardian links carry a hashed token, a code trusts the device, and the link chooses the tenant

- Status: accepted
- Date: 2026-10-25

## Context

Prompt 12 lets a guardian open a texted link, verify with a six-digit code and sign or decline a slip (`L2-015`, `L2-026`, `L2-027`). Guardians have no account. Requests carry no staff session, so the organization must come from somewhere the client cannot choose.

## Decision

- **Links.** Sending a slip mints one `GuardianLink` per child for its household: 256 random bits, base64url, with only the SHA-256 hash stored. Each household's text carries its children's links ("Mateo: …/g/slip/… · Sofía: …"), through a per-delivery text on `Delivery`. The web address comes from `Guardian:LinkBaseUrl`.
- **Tenant.** `GuardianAccess` finds the link by its hash and puts the request in the link's organization; nothing in the URL or body names a tenant. A revoked, unknown or long-expired link (a month after the sign-by date) answers 410 with the organization's phone.
- **Codes and devices.** A contact typed on the page gets a code only when it matches a mobile (by its last ten digits) or a working email of the household, and the answer is 202 either way. Codes are hashed with the link id and expire after 10 minutes. Three wrong codes lock the link for 15 minutes (423). A right code trusts the device for that household for 30 days through an HttpOnly cookie holding a token whose hash is stored. Changing a guardian's mobile revokes every link and device of the household. Code texts go straight to the provider and do not count against the SMS cap.
- **Signing.** A sign needs a typed name equal, ignoring case and spacing, to a guardian of the household who may sign. The signature keeps the canonical name, time, the browser's user agent, the household language and a SHA-256 of the slip text as shown. A decline keeps an optional reason.
- **Pages.** The `guardian` library's slip page sits outside the staff shell at `/g/slip/:token`, in a `ph-guardian-shell` with the organization's number in the footer. Strings are in English, Spanish or French by household language and `html lang` follows; the slip text is shown as written and the Spanish and French pages say the English text is the one signed.

## Consequences

The family page, enrollment links and surveys can reuse links, codes and devices. Notifying the site lead of a decline, a receipt by email, a language selector that saves to the household and translated slip texts come later.
