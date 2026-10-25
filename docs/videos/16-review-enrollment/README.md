# 16 · Review enrollment

> **Runtime:** ~2 min · **Audience:** contributors and product owners · **Prerequisites:** [15 · Enroll a child](../15-enroll-a-child/README.md)

**Video:** [16-review-enrollment.mp4](16-review-enrollment.mp4) · [Slides](slides.html) · **Audio:** [16-review-enrollment.mp3](16-review-enrollment.mp3) · [Transcript](script.md)

## Why this video exists

Slice 16 ([prompt](../../prompts/16-review-enrollment.md)) lets office staff accept, waitlist or decline the children families enrolled, one by one or in bulk, and texts each guardian.

## Learning objectives

By the end, the viewer can:

- review a child waiting for a program, with a note to the guardian;
- review several children together from the bulk action bar;
- explain who may review, and what happens when a program is full.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Who may review? | Admins and program directors; others get 403 |
| What does the guardian hear? | Enrolled, waitlisted with the number, or not enrolled with the reason |
| What if the program is full? | Accepting is refused with the count; waitlist instead |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Enrollment/ReviewEnrollmentHandler.cs` | decisions, capacity, texts |
| `frontend/projects/enrollment/src/lib/review-roster-page/review-roster-page.html` | tabs, selection, bulk bar |
| `docs/adr/0019-enrollment-review.md` | the decision |
| `clips/review-one-desktop.mp4`, `clips/bulk-review-phone.mp4` | the running app with the fake API |
| `shots/*.png` | full camp and the forbidden page |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:40 | Introduction, promises | Review before the roster |
| 00:40-01:00 | Tom reviews one child | Accept with a note |
| 01:00-01:15 | Several at once | Bulk accept |
| 01:15-01:30 | Full and declined | Capacity, reasons, roles |
| 01:30-02:05 | Testing, recap | Coverage |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter EnrollmentReviewTests
cd e2e; npx playwright test tests/enrollment/review.spec.ts
```

## Pitfalls

- A bulk review is all or nothing: one decided request or a full program refuses the whole batch.
- Managing the waitlist is a later slice (ADR 0019).

## References

- [WAI-ARIA Authoring Practices: Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
