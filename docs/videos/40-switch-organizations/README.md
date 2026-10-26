# 40 · Switch organizations

> **Runtime:** ~2 min · **Audience:** contributors and product owners · **Prerequisites:** [39 · Set up an organization](../39-set-up-an-organization/README.md)

**Video:** [40-switch-organizations.mp4](40-switch-organizations.mp4) · [Slides](slides.html) · **Audio:** [40-switch-organizations.mp3](40-switch-organizations.mp3) · [Transcript](script.md)

## Why this video exists

Slice 40 ([prompt](../../prompts/40-switch-organizations.md)) lets a person with several memberships switch the active organization, and the app reloads with that tenant's data and role.

## Learning objectives

By the end, the viewer can:

- explain what the active organization is and where it comes from;
- describe what happens when someone switches;
- say what happens when a membership is removed mid-session.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Where does the active organization come from? | The membership in the session cookie, never the request |
| What does switching change? | The cookie's membership; the app reloads at Today |
| Who sees the switcher? | Only people with two or more organizations |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Organizations/SwitchOrganizationHandler.cs` | list and switch |
| `backend/src/PromiseHub.Api/Middleware/TenantContextMiddleware.cs` | the removed-membership fallback |
| `docs/adr/0034-switch-organization.md` | the decision |
| `clips/switch-desktop.mp4` | the running app with the fake API |
| `shots/*.png` | one organization and phone |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:50 | Introduction, promises | One active organization |
| 00:50-01:10 | Switching | Priya to Northgate |
| 01:10-01:20 | One org | No switcher |
| 01:20-01:55 | Testing, recap | Cases |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter SwitchOrganizationTests
cd e2e; npx playwright test tests/shell/switch-organization.spec.ts
```

## Pitfalls

- "Set up a new organization" from the switcher waits for platform sign-up.

## References

- [OWASP: Multi-tenant authorization](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html)
