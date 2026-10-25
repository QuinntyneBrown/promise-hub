# 19 · Report an incident

> **Runtime:** ~2 min · **Audience:** contributors and product owners · **Prerequisites:** [18 · Manage waitlists](../18-manage-waitlists/README.md)

**Video:** [19-report-an-incident.mp4](19-report-an-incident.mp4) · [Slides](slides.html) · **Audio:** [19-report-an-incident.mp3](19-report-an-incident.mp3) · [Transcript](script.md)

## Why this video exists

Slice 19 ([prompt](../../prompts/19-report-an-incident.md)) lets any staff member report an incident for supervisor review.

## Learning objectives

By the end, the viewer can:

- report an incident from a phone;
- say who is told and who can read it;
- explain what is audited.

## Key questions

| Question | What a strong answer includes |
|---|---|
| What makes a report complete? | Type, child, when, what happened, what was done, guardian contact, severity |
| Who reads it? | Admins and program directors, and the reporter; others get 404 |
| What is recorded? | The report and every view |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Incidents/ReportIncidentHandler.cs` | validation and email |
| `backend/src/PromiseHub.Application/Incidents/IncidentAccess.cs` | the access rule |
| `docs/adr/0021-incident-reporting.md` | the decision |
| `clips/report-phone.mp4` | the running app with the fake API |
| `shots/*.png` | own reports and the log |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:50 | Introduction, promises | Facts and readers |
| 00:50-01:15 | Jaylen reports | The form to the report |
| 01:15-01:35 | Who reads it | Own reports, the log |
| 01:35-02:15 | Testing, recap | Coverage |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter IncidentTests
cd e2e; npx playwright test tests/incidents/report.spec.ts
```

## Pitfalls

- A report names one child; several children and restricted names come later (ADR 0021).
- Save draft is not built; an unsent report stays in the form until submitted.

## References

- [WCAG 2.2: Error identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification)
