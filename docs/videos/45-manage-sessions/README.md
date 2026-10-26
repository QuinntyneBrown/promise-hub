# 45 · Manage sessions

> **Runtime:** ~2 min · **Audience:** contributors and product owners · **Prerequisites:** [44 · Review audit history](../44-review-audit-history/README.md)

**Video:** [45-manage-sessions.mp4](45-manage-sessions.mp4) · [Slides](slides.html) · **Audio:** [45-manage-sessions.mp3](45-manage-sessions.mp3) · [Transcript](script.md)

## Why this video exists

Slice 45 ([prompt](../../prompts/45-manage-sessions.md)) lets staff view their account, regenerate recovery codes and sign out other sessions.

## Learning objectives

By the end, the viewer can:

- find the account page and say what it shows;
- explain how recovery codes are made and stored;
- explain how signing out everywhere works with cookie sessions.

## Key questions

| Question | What a strong answer includes |
|---|---|
| How are recovery codes stored? | As hashes; the plain codes are shown once |
| What happens to other sessions? | Their session version is old, so their next request answers 401 |
| Does a new sign-in work afterwards? | Yes; every cookie carries the current version |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Identity/AccountHandler.cs` | codes and sign-out |
| `backend/src/PromiseHub.Api/Middleware/TenantContextMiddleware.cs` | the version check |
| `docs/adr/0039-session-version.md` | the decision |
| `clips/account-desktop.mp4` | the running app with the fake API |
| `shots/*.png` | phone and dialog |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:50 | Introduction, promises | The account page |
| 00:50-01:15 | Securing | Codes and sign-out |
| 01:15-01:30 | Underneath | Session version |
| 01:30-02:00 | Testing, recap | Cases |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter AccountTests
cd e2e; npx playwright test tests/account/account.spec.ts
```

## Pitfalls

- Editing the profile, the password and personal notifications from the mock are not built.

## References

- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
