# 26 · Manage approved pickups

> **Runtime:** ~2 min · **Audience:** contributors and product owners · **Prerequisites:** [25 · Run check-in offline](../25-run-check-in-offline/README.md)

**Video:** [26-manage-approved-pickups.mp4](26-manage-approved-pickups.mp4) · [Slides](slides.html) · **Audio:** [26-manage-approved-pickups.mp3](26-manage-approved-pickups.mp3) · [Transcript](script.md)

## Why this video exists

Slice 26 ([prompt](../../prompts/26-manage-approved-pickups.md)) lets guardians and staff add or remove adults authorized to collect a child.

## Learning objectives

By the end, the viewer can:

- add and remove an approved adult as a guardian and as staff;
- explain who may change the list and what is recorded.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Who is on the list? | Guardians who may pick up, then approved adults |
| Who may change it? | The family after the code check; site leads, directors and admins |
| What happens on removal? | The row is kept, the guardian is texted for staff removals, it is audited |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Attendance/ApprovedPickupsHandler.cs` | add and remove |
| `frontend/projects/guardian/src/lib/guardian-pickup-dialog/guardian-pickup-dialog.html` | the family dialog |
| `docs/adr/0024-approved-pickups.md` | the decision |
| `clips/family-pickups-phone.mp4` | the running app with the fake API |
| `shots/*.png` | add dialog and the Quick Card |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:45 | Introduction, promises | One list |
| 00:45-01:10 | Linh adds | Family page |
| 01:10-01:25 | Staff | Quick Card |
| 01:25-02:00 | Testing, recap | Coverage |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter ApprovedPickupTests
cd e2e; npx playwright test tests/attendance/approved-pickups.spec.ts tests/guardian/pickups.spec.ts
```

## Pitfalls

- The household page doesn't show the list yet; staff use the Quick Card (ADR 0024).

## References

- [WCAG 2.2: Consistent help](https://www.w3.org/WAI/WCAG22/Understanding/consistent-help)
