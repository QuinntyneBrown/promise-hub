# 47 · Manage organizations

> **Runtime:** ~2 min · **Audience:** contributors and product owners · **Prerequisites:** [46 · Recover account access](../46-recover-account-access/README.md)

**Video:** [47-manage-organizations.mp4](47-manage-organizations.mp4) · [Slides](slides.html) · **Audio:** [47-manage-organizations.mp3](47-manage-organizations.mp3) · [Transcript](script.md)

## Why this video exists

Slice 47 lets platform admins list, add, suspend and reinstate organizations.

## Learning objectives

By the end, the viewer can:

- describe what the organizations list shows and who can open it;
- explain what adding an organization creates;
- say what suspension blocks and what it keeps.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Who opens the list? | Only platform admins; others get 403 |
| What does adding create? | The tenant, its module preset and an invitation for the first admin |
| What does suspending do? | Blocks staff, guardian links and sends; deletes nothing |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Organizations/PlatformOrganizationsHandler.cs` | list, add, suspend, reinstate |
| `docs/adr/0041-platform-organizations.md` | the decision |
| `clips/*.mp4` | the running app with the fake API |
| `shots/*.png` | suspended sign in and field errors |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:45 | Introduction, promises | What platform admins can do |
| 00:45-01:05 | Adding | Kitchener Youth Alliance |
| 01:05-01:20 | Suspending | Northgate |
| 01:20-02:00 | Suspended, testing, recap | Cases |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter PlatformOrganizationTests
cd e2e; npx playwright test tests/administration/organizations.spec.ts
```

## Pitfalls

- Granting platform admin is a database change for now.

## References

- [Multitenant SaaS architecture (Microsoft Learn)](https://learn.microsoft.com/azure/architecture/guide/multitenant/overview)
