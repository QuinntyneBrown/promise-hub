# 15 · Enroll a child

> **Runtime:** ~3 min · **Audience:** contributors and product owners · **Prerequisites:** [14 · Import a roster](../14-import-a-roster/README.md)

**Video:** [15-enroll-a-child.mp4](15-enroll-a-child.mp4) · [Slides](slides.html) · **Audio:** [15-enroll-a-child.mp3](15-enroll-a-child.mp3) · [Transcript](script.md)

## Why this video exists

Slice 15 ([prompt](../../prompts/15-enroll-a-child.md)) lets staff open a program for enrollment and families enroll children from one link.

## Learning objectives

By the end, the viewer can:

- open and close a program's enrollment and share its link;
- follow a guardian from the code to a submitted enrollment;
- explain what waits for staff review and when a child is waitlisted.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Who gets the code? | The contact the guardian types, which need not be on file |
| What is filled in for a returning family? | Last season's household and children, matched only within the organization |
| When is a child waitlisted? | When accepted enrollments have reached the program's capacity |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Enrollment/GuardianEnrollmentHandler.cs` | code, draft, submit |
| `frontend/projects/guardian/src/lib/guardian-enroll-page/guardian-enroll-page.html` | the steps |
| `docs/adr/0018-guardian-enrollment.md` | the decision |
| `clips/open-enrollment-desktop.mp4`, `clips/new-family-phone.mp4` | the running app with the fake API |
| `shots/*.png` | returning family and closed link |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:55 | Introduction, promises | The link and the review |
| 00:55-01:10 | Marisol opens enrollment | The link to share |
| 01:10-01:50 | A new family enrolls | Code to thank-you |
| 01:50-02:10 | Returning and closed | Spanish, closed |
| 02:10-02:55 | Testing, recap | Coverage |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter EnrollmentTests
cd e2e; npx playwright test tests/guardian/enroll.spec.ts
```

## Pitfalls

- The identify and code steps are in English; the page switches to the household's language once known (ADR 0018).
- Staff review and notifications are the next slice.

## References

- [WCAG 2.2: Redundant entry](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry)
