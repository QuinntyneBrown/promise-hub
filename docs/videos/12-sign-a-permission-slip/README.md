# 12 · Sign a permission slip

> **Runtime:** ~3 min · **Audience:** contributors and product owners · **Prerequisites:** [11 · Send permission slips](../11-send-permission-slips/README.md)

**Video:** [12-sign-a-permission-slip.mp4](12-sign-a-permission-slip.mp4) · [Slides](slides.html) · **Audio:** [12-sign-a-permission-slip.mp3](12-sign-a-permission-slip.mp3) · [Transcript](script.md)

## Why this video exists

Slice 12 ([prompt](../../prompts/12-sign-a-permission-slip.md)) lets a guardian sign or decline a slip from a texted link, verified with a code, in the household's language.

## Learning objectives

By the end, the viewer can:

- follow a guardian from the text to a signed slip;
- explain how the link, the code and the trusted device protect a family;
- say what a signature record keeps.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Who chooses the organization for a guardian request? | The link: its token's hash finds the link, never the URL or body |
| What does a signature keep? | Name, time, device, language and a SHA-256 of the text as shown |
| When does a link stop working? | A month after the sign-by date, or when the family's mobile changes |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Guardian/GuardianAccess.cs` | the link picks the tenant |
| `backend/src/PromiseHub.Application/Guardian/VerifyGuardianCodeHandler.cs` | codes, lock and device |
| `docs/adr/0015-guardian-links.md` | the decision |
| `clips/carmen-signs-phone.mp4`, `clips/dana-declines-phone.mp4` | the running app with the fake API |
| `shots/*.png` | refused name and expired link |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:55 | Introduction, promises | Links, codes, the record |
| 00:55-01:30 | Carmen signs | In Spanish |
| 01:30-01:50 | Dana declines | With a reason |
| 01:50-02:15 | Keeping families safe | Refused name, expired link |
| 02:15-03:00 | Testing, recap | Coverage |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter GuardianSlipTests
cd e2e; npx playwright test tests/guardian
```

## Pitfalls

- The slip text is sent as written; the Spanish and French pages say the English text is the one signed.
- Code texts go straight to the provider and do not count against the SMS cap (ADR 0015).

## References

- [OWASP: Forgot password and one-time codes](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
