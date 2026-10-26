# 44 · Review audit history

> **Runtime:** ~2 min · **Audience:** contributors and product owners · **Prerequisites:** [43 · Request household data](../43-request-household-data/README.md)

**Video:** [44-review-audit-history.mp4](44-review-audit-history.mp4) · [Slides](slides.html) · **Audio:** [44-review-audit-history.mp3](44-review-audit-history.mp3) · [Transcript](script.md)

## Why this video exists

Slice 44 ([prompt](../../prompts/44-review-audit-history.md)) lets an admin search sensitive actions by person, record and time and export them.

## Learning objectives

By the end, the viewer can:

- say what the audit log records;
- search and filter it to answer a question;
- explain how exports are themselves recorded.

## Key questions

| Question | What a strong answer includes |
|---|---|
| What does search match? | The person, the record type and the details |
| What period is shown first? | The last 7 days, newest first |
| Who can read the log? | Admins only, for their own organization |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Audit/AuditLogHandler.cs` | search and export |
| `frontend/projects/administration/src/lib/audit-log-page/audit-log-page.html` | the page |
| `docs/adr/0038-audit-log-search.md` | the decision |
| `clips/audit-desktop.mp4` | the running app with the fake API |
| `shots/*.png` | forbidden and phone |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:50 | Introduction, promises | What is recorded |
| 00:50-01:10 | Searching | Mateo, then views |
| 01:10-01:20 | Export | Same filters |
| 01:20-01:55 | Testing, recap | Cases |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter AuditLogTests
cd e2e; npx playwright test tests/administration/audit-log.spec.ts
```

## Pitfalls

- Device and location show only where they were recorded.

## References

- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
