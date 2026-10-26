# 30 · Start an invited shift

> **Runtime:** ~2 min · **Audience:** contributors and product owners · **Prerequisites:** [29 · Manage staff access](../29-manage-staff-access/README.md)

**Video:** [30-start-an-invited-shift.mp4](30-start-an-invited-shift.mp4) · [Slides](slides.html) · **Audio:** [30-start-an-invited-shift.mp3](30-start-an-invited-shift.mp3) · [Transcript](script.md)

## Why this video exists

Slice 30 ([prompt](../../prompts/30-start-an-invited-shift.md)) lets an invited worker accept, add a phone and reach today's assigned session.

## Learning objectives

By the end, the viewer can:

- accept an invitation and complete onboarding;
- explain what is created and where.

## Key questions

| Question | What a strong answer includes |
|---|---|
| What does accepting create? | A `StaffUser` (or uses the existing one) and a membership in the invitation's organization |
| Can the link be reused? | No; a used, expired or withdrawn link answers 410 |
| Who sees the worker's mobile? | Staff alerts only; never guardians |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Staff/InvitationHandler.cs` | get, accept, phone |
| `frontend/projects/account/src/lib/accept-invite/accept-invite-page.html` | the page |
| `docs/adr/0025-staff-access.md` | the decision |
| `clips/invited-phone.mp4` | the running app with the fake API |
| `shots/*.png` | area code and expired |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:45 | Introduction, promises | Link to ready |
| 00:45-01:10 | Sam accepts | Phone flow |
| 01:10-01:25 | Mistakes | Inline errors, expired |
| 01:25-02:00 | Testing, recap | Coverage |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter InvitationTests
cd e2e; npx playwright test tests/account/accept-invite.spec.ts
```

## Pitfalls

- Choosing programs to cache on the device is not built yet (ADR 0025).

## References

- [NIST SP 800-63B: Memorized secrets](https://pages.nist.gov/800-63-3/sp800-63b.html)
