# 02 · Sign in securely

> **Runtime:** ~3 min · **Audience:** contributors and product owners · **Prerequisites:** [01 · The walking skeleton](../01-walking-skeleton/README.md)

**Video:** [02-sign-in-securely.mp4](02-sign-in-securely.mp4) · [Slides](slides.html) · **Audio:** [02-sign-in-securely.mp3](02-sign-in-securely.mp3) · [Transcript](script.md)

## Why this video exists

Slice 02 ([prompt](../../prompts/02-sign-in-securely.md)) puts every staff page behind a sign-in and establishes server-side role checks.

## Learning objectives

By the end, the viewer can:

- describe what a staff member sees for a wrong password, a lockout and the code step;
- explain why sign-in never reveals whether an email exists;
- say what an expired session does and where roles are enforced.

## Key questions

| Question | What a strong answer includes |
|---|---|
| When is sign-in paused? | Five failures for an email in 15 minutes, whether or not it exists |
| Who enters a code? | Admins and program directors with an enrolled authenticator |
| What stops a site lead opening settings? | The server's permission check answers 403 |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Identity/SignInHandler.cs` | lockout and the MFA decision |
| `backend/src/PromiseHub.Api/Authentication/AuthenticationSetup.cs` | cookie settings and `session-expired` |
| `backend/src/PromiseHub.Application/Identity/RolePermissions.cs` | role to permission |
| `clips/sign-in-desktop.mp4`, `clips/mfa-phone.mp4` | the running app with the fake API |
| `shots/*.png` | default, invalid, locked and code states |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:40 | Introduction, promises | What sign-in guarantees |
| 00:40-01:10 | Jaylen signs in | Wrong password, Today, account menu |
| 01:10-01:35 | Failures | One message, lockout |
| 01:35-01:55 | Tom enters a code | The code step on a phone |
| 01:55-02:35 | Sessions and the server | Cookie, expiry, 403, audit |
| 02:35-03:05 | Testing, recap | Fake clock, fake API |

## Demo commands

```powershell
$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:Seed__StaffPassword = "<a local password>"
$env:Seed__MfaSecret = "<a base32 secret>"
dotnet run --project backend/src/PromiseHub.Cli -- reset
cd e2e; npx playwright test tests/account
```

## Pitfalls

- Seeded staff can only sign in when `Seed:StaffPassword` is configured; never commit it.
- Lockout counts attempts per email, so tests use a different email for each lockout case.

## References

- [ASP.NET Core cookie authentication](https://learn.microsoft.com/aspnet/core/security/authentication/cookie)
- [RFC 6238: TOTP](https://www.rfc-editor.org/rfc/rfc6238)
