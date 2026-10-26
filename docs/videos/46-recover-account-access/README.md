# 46 · Recover account access

> **Runtime:** ~2 min · **Audience:** contributors and product owners · **Prerequisites:** [45 · Manage sessions](../45-manage-sessions/README.md)

**Video:** [46-recover-account-access.mp4](46-recover-account-access.mp4) · [Slides](slides.html) · **Audio:** [46-recover-account-access.mp3](46-recover-account-access.mp3) · [Transcript](script.md)

## Why this video exists

Slice 46 ([prompt](../../prompts/46-recover-account-access.md)) lets a staff member reset a forgotten password through an emailed link and resume work.

## Learning objectives

By the end, the viewer can:

- describe the reset journey from sign in to Today;
- explain why the request never reveals who has an account;
- say what a reset does to other sessions.

## Key questions

| Question | What a strong answer includes |
|---|---|
| How long does a link work? | Once, for one hour |
| How is the link stored? | Only a hash of its token |
| What happens to other devices? | The session version rises, so they're signed out |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Identity/PasswordResetHandler.cs` | request, check, reset |
| `docs/detailed-designs/identity/recover-access/README.md` | the new design |
| `docs/adr/0040-password-reset.md` | the decision |
| `clips/*.mp4` | the running app with the fake API |
| `shots/*.png` | expired and invalid |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:50 | Introduction, promises | How recovery works |
| 00:50-01:05 | Asking | The link |
| 01:05-01:20 | Resetting | New password |
| 01:20-01:55 | Expired, testing, recap | Cases |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter PasswordResetTests
cd e2e; npx playwright test tests/account/reset-password.spec.ts
```

## Pitfalls

- Requests are not throttled per address yet.

## References

- [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
