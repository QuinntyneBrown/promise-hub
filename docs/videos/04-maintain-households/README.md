# 04 · Maintain households

> **Runtime:** ~3 min · **Audience:** contributors and product owners · **Prerequisites:** [03 · Configure modules](../03-configure-modules/README.md)

**Video:** [04-maintain-households.mp4](04-maintain-households.mp4) · [Slides](slides.html) · **Audio:** [04-maintain-households.mp3](04-maintain-households.mp3) · [Transcript](script.md)

## Why this video exists

Slice 04 ([prompt](../../prompts/04-maintain-households.md)) builds the roster every other module reads.

## Learning objectives

By the end, the viewer can:

- find, add and edit households, guardians and children;
- explain how medical changes and views are audited;
- say which roles see medical details and which may delete.

## Key questions

| Question | What a strong answer includes |
|---|---|
| What makes a household "Missing info"? | No guardian with a mobile or a working email |
| Who sees medical details? | Admins, program directors and site leads; each read is logged |
| What happens on delete? | Soft delete, gone from every list, purged after 30 days |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Households/UpdateMedicalHandler.cs` | before and after in the audit entry |
| `backend/src/PromiseHub.Application/Households/GetChildHandler.cs` | medical fields omitted, views logged |
| `backend/src/PromiseHub.Infrastructure/Persistence/PromiseHubDbContext.cs` | the soft-delete filter |
| `clips/households-desktop.mp4`, `clips/restricted-phone.mp4` | the running app with the fake API |
| `shots/*.png` | Families, household, child, dialogs |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:45 | Introduction, promises | What the roster guarantees |
| 00:45-01:25 | Tom keeps the roster | Search, add a child, edit medical |
| 01:25-01:50 | The states | Invalid add family, Missing info, delete |
| 01:50-02:25 | Who sees what | Aisha's restricted view |
| 02:25-03:00 | Testing, recap | Audit, cross-tenant, roles, module off |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter HouseholdsTests
cd e2e; npx playwright test tests/households
```

## Pitfalls

- `can()` in the API client must change with `RolePermissions` on the server.
- Deleting is soft: rows stay until the purge job, which arrives with background jobs.

## References

- [EF Core global query filters](https://learn.microsoft.com/ef/core/querying/filters)
- [Angular CDK Dialog](https://material.angular.dev/cdk/dialog/overview)
