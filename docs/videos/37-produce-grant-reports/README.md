# 37 · Produce grant reports

> **Runtime:** ~2 min · **Audience:** contributors and product owners · **Prerequisites:** [36 · Configure notifications](../36-configure-notifications/README.md)

**Video:** [37-produce-grant-reports.mp4](37-produce-grant-reports.mp4) · [Slides](slides.html) · **Audio:** [37-produce-grant-reports.mp3](37-produce-grant-reports.mp3) · [Transcript](script.md)

## Why this video exists

Slice 37 ([prompt](../../prompts/37-produce-grant-reports.md)) lets a program director filter attendance and demographics and export funder-ready results with small counts masked.

## Learning objectives

By the end, the viewer can:

- say where each report number comes from;
- explain small-count masking on screen and in exports;
- describe how an export is stored, audited and expired.

## Key questions

| Question | What a strong answer includes |
|---|---|
| How is the attendance rate computed? | Present or signed out over present plus absent, for sessions that have started |
| Who sees exact counts under 5? | Directors and admins on screen; exports always mask |
| How long does an export link work? | Seven days, then 410 |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Reports/ReportCalculator.cs` | the numbers and masking |
| `backend/src/PromiseHub.Application/Reports/ReportsHandler.cs` | the CSV export |
| `docs/adr/0031-grant-reports.md` | the decision |
| `clips/reports-desktop.mp4` | the running app with the fake API |
| `shots/*.png` | masked and phone |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:55 | Introduction, promises | Where numbers come from |
| 00:55-01:25 | Building | Filter and export |
| 01:25-01:35 | Masking | Site lead and phone |
| 01:35-02:10 | Testing, recap | Cases |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter ReportTests
cd e2e; npx playwright test tests/reports
```

## Pitfalls

- Gender, funder XLSX templates, custom date ranges and background exports are not built.

## References

- [Statistics Canada: confidentiality and small cells](https://www.statcan.gc.ca/en/about/policy/info-user)
