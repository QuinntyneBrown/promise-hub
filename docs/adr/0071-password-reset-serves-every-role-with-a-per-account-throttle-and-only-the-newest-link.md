# 0071: Password reset serves every role, with a per-account throttle and only the newest link

- Status: accepted
- Date: 2026-10-28

## Context

Prompt 77 ports Waypoint's password reset (`L2-AUTH-005`) and password policy (`L2-AUTH-008`) for youth and mentors as `L2-115` and `L2-116`. PromiseHub already has a reset for staff (prompt 46, ADR 0040) and one password policy (prompt 51, ADR 0045); prompt 50 made the reset land on the role home. Waypoint shows separate `reset-link-sent` and `reset-success` pages, masks the address, offers resend, and revokes refresh tokens. A reset request is anonymous, so nothing stopped a script from flooding someone's inbox, and every link ever sent stayed usable for its hour.

## Decision

- **One reset for every role.** The same pages and endpoints serve staff, youth, mentors and volunteers; the field is labelled "Email". Identity belongs to no module and is always on.
- **Throttle per account, silently.** At most three links per account in a rolling hour (`PasswordReset.PerHour`), counted from the stored links, so no new table or migration. A further request answers the same 202 and sends nothing, so the throttle reveals nothing. Per-IP limits are left to the hosting edge.
- **Only the newest link works.** A link is usable when it is unused, under an hour old, and no newer link exists for the account. Checking a link also requires a current membership, so a link sent before deactivation stops working.
- **Waypoint's extra pages are states.** `reset-link-sent` is `forgot-password/success` (masked address, Resend the email, a Sent again toast); `reset-success` is the role home with the toast "Password updated", since PromiseHub signs the person in after a reset.
- **Sessions end through the session version.** A password belongs to the person, so raising `StaffUser.SessionVersion` ends their sessions in every organization; the audit entry goes to the organization the new session starts in only.
- **Deferred.** Sending a reset from an admin's person record (ADR 0070), change password while signed in, and removing the token from the address bar after the link is read.

## Consequences

- `PasswordResetHandler` holds the throttle and the newest-link rule; the fake API mirrors both.
- The `forgot-password` and `reset-password` mocks gain youth, mentor, resent, loading, weak and failed states.
