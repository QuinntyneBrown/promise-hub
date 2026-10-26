# 29 · Manage staff access

> **Runtime:** ~2 min · **Audience:** contributors and product owners · **Prerequisites:** [08 · Sign children out](../08-sign-children-out/README.md)

**Video:** [29-manage-staff-access.mp4](29-manage-staff-access.mp4) · [Slides](slides.html) · **Audio:** [29-manage-staff-access.mp3](29-manage-staff-access.mp3) · [Transcript](script.md)

## Why this video exists

Slice 29 ([prompt](../../prompts/29-manage-staff-access.md)) lets an admin invite staff, assign roles and remove access.

## Learning objectives

By the end, the viewer can:

- invite staff with a role and withdraw an invitation;
- change a role and remove access;
- explain when changes take effect.

## Key questions

| Question | What a strong answer includes |
|---|---|
| When does a role change apply? | On the person's next request; the role is read each time |
| What does removal do? | Sets `RemovedAt`; the next request is 401; records keep the name |
| What can't an admin do? | Change or remove themselves |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Staff/StaffAccessHandler.cs` | invite, role, remove |
| `backend/src/PromiseHub.Api/Middleware/TenantContextMiddleware.cs` | removed memberships refused |
| `docs/adr/0025-staff-access.md` | the decision |
| `clips/staff-desktop.mp4` | the running app with the fake API |
| `shots/*.png` | remove and forbidden |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:50 | Introduction, promises | Who and when |
| 00:50-01:15 | Invite and promote | Sam and Jaylen |
| 01:15-01:30 | Removing access | Aisha |
| 01:30-02:05 | Testing, recap | Coverage |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter StaffAccessTests
cd e2e; npx playwright test tests/administration/staff.spec.ts
```

## Pitfalls

- Accepting the invitation is the next slice (ADR 0025).

## References

- [OWASP: Authorization cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
