# 0044: Youth and mentors share staff sign-in; the role home is chosen in the app; sign-out ends the session on the server

- Status: accepted
- Date: 2026-10-26

## Context

Prompt 50 ports Waypoint's sign-in journey (`L2-AUTH-001`, `-006`, `-007`, `-012`, `L2-PLATFORM-010`) so youth and mentors can sign in (`L2-046` to `L2-050`). Waypoint issues JWT access tokens with rotating refresh tokens and has separate pages for a locked account, an expired session and an inactive account. PromiseHub uses cookie sessions (ADR 0005), a session version for signing out everywhere (ADR 0039) and already shows the lock and the timeout as states of `sign-in`.

## Decision

- **One sign-in.** Youth and mentors use `POST /auth/sign-in` and the `sign-in` page; the email field is labelled "Email". Participant roles never need a second factor.
- **Role home in the app.** `roleHome(session)` in the `api` library reads `/me`: Youth go to `/learning` and Mentors to `/mentoring` while that module is on; everyone else, and a participant whose module is off, goes to Today. A safe return URL wins. The server's response to sign-in does not change.
- **Existing states, not new pages.** Waypoint's account-locked and session-expired pages are PromiseHub's `sign-in/locked` and `sign-in/expired` states. Only `signed-out` and `account-deactivated` are new pages, in the `account` library, outside the shell.
- **Consecutive failures.** The lock counts failures since the email's last success inside the 15-minute window, so a success resets it. The fifth failure audits `SignInLocked` in every organization where the email has a current membership (none for an unknown email). A password reset during a lock audits `SignInUnlocked` and records a success.
- **Ended sessions instead of refresh-token revocation.** Each cookie carries a `session_id` claim. `POST /auth/sign-out` records an `EndedSession` (not tenant-owned, kept for the 12 hours the cookie could live) and audits `SignedOut`; `TenantContextMiddleware` answers 401 for an ended session, so a copied cookie stops working. Rotation and reuse detection have no cookie counterpart.
- **The device forgets.** Signing out clears the loaded session and the offline store (`promisehub.offline.*`), whether or not the request succeeds.
- **Deactivated only after the right password.** A correct password with no current membership answers 403 "account-deactivated"; a session whose last membership was removed answers 401 "account-deactivated". A wrong password stays the generic 401, so the state never reveals whether an email has an account. Waypoint's "contact the director" link is not carried over; the page names the program director or admin.

## Consequences

- Check-ins queued offline and not yet sent are lost when someone signs out; warning before signing out with unsent check-ins is deferred.
- The session-expired dialog that replays a pending form (`L2-006` criterion 4) remains deferred.
- Cookies issued before this change carry no session id; they keep working until they expire and cannot be ended individually.
