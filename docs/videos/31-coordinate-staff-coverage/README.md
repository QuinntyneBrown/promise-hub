# 31 · Coordinate staff coverage

> **Runtime:** ~2 min · **Audience:** contributors and product owners · **Prerequisites:** [30 · Start an invited shift](../30-start-an-invited-shift/README.md)

**Video:** [31-coordinate-staff-coverage.mp4](31-coordinate-staff-coverage.mp4) · [Slides](slides.html) · **Audio:** [31-coordinate-staff-coverage.mp3](31-coordinate-staff-coverage.mp3) · [Transcript](script.md)

## Why this video exists

Slice 31 ([prompt](../../prompts/31-coordinate-staff-coverage.md)) lets a volunteer coordinator see coverage, assign staff to sessions and invite volunteers.

## Learning objectives

By the end, the viewer can:

- read coverage and spot gaps;
- assign staff to a session;
- explain what a coordinator may invite.

## Key questions

| Question | What a strong answer includes |
|---|---|
| What does assigning do? | Replaces the session's staff; youth workers then run it |
| Who may assign? | Admins, directors, site leads and coordinators |
| Who may a coordinator invite? | Youth workers only |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Staff/CoverageHandler.cs` | coverage and assignment |
| `frontend/projects/administration/src/lib/coverage-page/coverage-page.html` | the page |
| `docs/adr/0025-staff-access.md` | the decision |
| `clips/coverage-desktop.mp4` | the running app with the fake API |
| `shots/*.png` | invite and phone |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:45 | Introduction, promises | Coverage and gaps |
| 00:45-01:10 | Filling a gap | Assign staff |
| 01:10-01:25 | Inviting | Youth worker only |
| 01:25-02:00 | Testing, recap | Coverage |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter CoverageTests
cd e2e; npx playwright test tests/administration/coverage.spec.ts
```

## Pitfalls

- Coverage shows 14 days; longer planning is not built.

## References

- [WCAG 2.2: Info and relationships](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships)
