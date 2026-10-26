# 0039: Signing out everywhere raises a session version carried in the cookie; recovery codes are stored as hashes

- Status: accepted
- Date: 2026-10-26

## Context

Prompt 45 lets staff view their account, regenerate recovery codes and sign out other sessions (`L2-006`, `L2-031`). Sessions are cookies with no server-side session store (ADR 0002).

## Decision

- **Session version.** `StaffUser.SessionVersion` is written into every session cookie (`session_version`). The tenant middleware refuses a cookie whose version differs from the person's current one, so `POST /me/sign-out-others` (which raises it and re-issues this device's cookie) ends every other session on its next request. Every cookie is issued through `SessionCookie.SignInAsync`, which reads the current version, so a fresh sign-in always works.
- **Recovery codes.** `POST /me/recovery-codes` makes ten random codes (`xxxx-xxxx`), returns them once and stores only their hashes (`StaffUser.RecoveryCodes`), replacing the old ones. Using a code to sign in is prompt 46.
- **Account.** `GET /me/account` returns the person's name, email, mobile, role, organization, two-step status and codes left. All three actions are audited.
- **Frontend.** `ACCOUNT_API`; `AccountPage` at `/account` in the `account` library, with `RecoveryCodesDialog` and `SignOutAllDialog`; the `key` icon joined the components library.

## Consequences

One database read per request checks the version. Editing the profile, changing the password and personal notification switches from the mock are not built.
