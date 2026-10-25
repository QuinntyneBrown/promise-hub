# 21 · Review incidents

> **Runtime:** ~2 min · **Audience:** contributors and product owners · **Prerequisites:** [20 · Report an incident as a youth worker](../20-report-an-incident-as-a-youth-worker/README.md)

**Video:** [21-review-incidents.mp4](21-review-incidents.mp4) · [Slides](slides.html) · **Audio:** [21-review-incidents.mp3](21-review-incidents.mp3) · [Transcript](script.md)

## Why this video exists

Slice 21 ([prompt](../../prompts/21-review-incidents.md)) lets a supervisor review incident reports and record follow-up.

## Learning objectives

By the end, the viewer can:

- mark a report reviewed with a note and an outcome;
- add a follow-up and reopen a report;
- read the trail.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Who reviews? | Admins and program directors; others get 403 |
| What does a review need? | A note and an outcome |
| Where does the trail come from? | The audit log |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Incidents/IncidentReviewHandler.cs` | review, follow-up, reopen |
| `frontend/projects/components/src/lib/timeline/timeline.html` | the new library timeline |
| `docs/adr/0021-incident-reporting.md` | the decision |
| `clips/review-desktop.mp4` | the running app with the fake API |
| `shots/*.png` | invalid dialog and closed report |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:45 | Introduction, promises | Note, outcome, trail |
| 00:45-01:10 | Marisol reviews | Review and follow-up |
| 01:10-01:25 | Rules | Note required, no double review |
| 01:25-02:05 | Testing, recap | Coverage |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter IncidentTests
cd e2e; npx playwright test tests/incidents/review.spec.ts
```

## Pitfalls

- Follow-up is a dialog, not the inline form in the mock, because pages have no inline forms (ADR 0021).

## References

- [WCAG 2.2: Focus not obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum)
