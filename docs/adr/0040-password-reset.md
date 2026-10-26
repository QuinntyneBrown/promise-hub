# 0040: Password reset is a one-hour, single-use emailed link stored as a hash, and it signs out other devices

- Status: accepted
- Date: 2026-10-26

## Context

Prompt 46 lets a staff member reset a forgotten password through an emailed link and resume work (`L2-044`). Sessions carry a session version (ADR 0039), and guardian links already use hashed random tokens.

## Decision

- **Asking.** `POST /auth/forgot-password` (anonymous) answers 202 whatever the address; for a person with a current membership it stores a `PasswordReset` (only the token's hash, one-hour expiry) and emails `/reset-password?token=…`.
- **Checking.** `GET /auth/reset-password/{token}` returns the account's email, or 410 when the link is unknown, used or expired.
- **Resetting.** `POST /auth/reset-password` requires a password of at least 12 characters entered twice; it replaces the hash, marks the link used, raises the session version (signing out every other device), audits the change and starts a session, or the MFA step when the role needs it.
- **Frontend.** `ForgotPasswordPage` at `/forgot-password` and `ResetPasswordPage` at `/reset-password` in the `account` library, outside the shell; `AuthApi` gains `forgotPassword`, `checkReset` and `resetPassword`.

## Consequences

Requests are not rate-limited beyond the email provider's own limits; a throttle per address can follow.
