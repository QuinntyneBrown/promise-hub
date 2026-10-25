# 0005: Cookie sessions, a separate MFA ticket and TOTP

- Status: accepted
- Date: 2026-10-25

## Context

`L2-006` needs password sign-in, lockout, a second factor for admins and a 12-hour idle timeout; the sign-in design left the cookie name, `SameSite`, hashing parameters and recovery codes open.

## Decision

- The session is an ASP.NET Core cookie, `.PromiseHub.Session`: HttpOnly, Secure, `SameSite=Strict`, 12 hours sliding. "Keep me signed in" makes it persistent. It carries the user id and the active membership id; the role is read from the membership on every request.
- A request that sends the session cookie but no longer authenticates answers 401 with `{ "code": "session-expired" }`; without a cookie the code is `unauthenticated`.
- Between the password and the code, a separate five-minute cookie (`.PromiseHub.Mfa`) grants nothing but `POST /auth/mfa`.
- Passwords use ASP.NET Core Identity's `PasswordHasher` (PBKDF2, its default parameters). Codes are RFC 6238 (SHA-1, 30 s, six digits, one step of drift), verified with a fixed-time comparison.
- Every password check is stored as a `SignInAttempt`, known email or not, so five failures in 15 minutes lock any email and the response never reveals whether it exists.
- Seeded staff passwords and MFA secrets come from configuration (`Seed:StaffPassword`, `Seed:MfaSecret`).

## Consequences

Revocation before expiry (sign out everywhere, removed staff) needs a server-side session store; it arrives with `manage-sessions`. Recovery codes and trusted devices arrive with `recover-account-access`.
