# 80 · Report, export and import learning data

> **Runtime:** ~6.5 min · **Audience:** program directors, admins and office managers, site leads, developers · **Prerequisites:** [79 · Configure the organization](../79-configure-the-organization/README.md), and the earlier videos on producing grant reports and importing a roster

**Video:** [80-report-export-and-import.mp4](80-report-export-and-import.mp4) · [Slides](slides.html) · **Audio:** [80-report-export-and-import.mp3](80-report-export-and-import.mp3) · [Transcript](script.md)

## Why this video exists

Prompt 80 brings Waypoint's journey 29 (`L2-REPORT-001`, `L2-REPORT-003`, `L2-REPORT-004`, `L2-ADMIN-004`) to PromiseHub as `L2-127` to `L2-131` (ADR 0074). Reports gains Detailed reports: a cohort report, a youth report, staff activity and the progress board, each section shown only while its module is on. Every detailed report exports exactly what it shows as CSV, and a roster import can place youth in their cohorts and invite them to a youth account.

## Learning objectives

By the end, the viewer can:

- Open the cohort report and the youth report and say where each number comes from.
- Read the progress board and say what Done, In progress, Not started and No account mean.
- Export a detailed report and say what the file holds, how long the link lasts and what is audited.
- Read staff activity and say when a mentor is overloaded.
- Import a roster with Group and Youth email columns and say why a row is not placed or not invited.
- Say what a module that is off, a role without `ViewReports` and another organization get.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Where does completion come from? | Lessons done of the track's published lessons, read for the child's youth account through `LearnerProgress`; no account reads No account |
| What does the youth report never show? | A mentor check-in's topics, actions or private notes (ADR 0061): only the count, latest date and engagement |
| What does an export hold? | Exactly the rows and columns on screen, an off module's columns left out; 7 days then 410; audited with the kind and row count |
| When is a mentor overloaded? | More than 8 youth assigned; underloaded below 4 |
| Who can import a youth email column? | An admin while Learning is on; otherwise 422; invitations follow the youth-invitation rules and are never duplicated |
| What does a module that is off get? | No card, no link, no request; the staff report needs Mentoring and the progress board Learning, else 404 |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Reports/DetailedReportsHandler.cs` | `CohortAsync`, `YouthAsync`, `StaffAsync`, `ProgressAsync` |
| `backend/src/PromiseHub.Application/Reports/ReportsHandler.cs`, `ReportCsv.cs` | Exports by kind |
| `backend/src/PromiseHub.Application/Imports/ImportRows.cs`, `RunImportHandler.cs`, `SaveMappingHandler.cs` | Cohort matching and invitation rules |
| `frontend/projects/reports/src/lib/` | `CohortReportPage`, `YouthReportPage`, `StaffReportPage`, `ProgressBoardPage`, `ExportReportDialog` |
| `frontend/projects/components/src/lib/table/` | `PhTable`'s footer row |
| `shots/desktop-detailed.png`, `desktop-cohort.png`, `desktop-cohort-youth.png`, `desktop-youth.png` | Detailed reports, the cohort and youth reports |
| `shots/desktop-board.png`, `phone-board.png`, `phone-cohort.png`, `desktop-export.png`, `desktop-staff.png` | The board, the export and staff activity |
| `shots/desktop-import-mapping.png`, `desktop-import-review.png`, `desktop-import-done.png` | The import |
| `shots/desktop-northgate.png`, `desktop-forbidden.png`, `desktop-empty.png`, `desktop-error.png`, `desktop-no-account.png` | Off, forbidden, empty, error, no account |
| `clips/cohort-desktop.mp4`, `board-desktop.mp4`, `import-desktop.mp4`, `reports-phone.mp4`, `states-desktop.mp4` | Screen recordings of the running app against a fake API |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:25 | Introduction | The spreadsheets these reports replace |
| 00:25-00:53 | Detailed reports | The card, only what the modules allow |
| 00:53-01:30 | Cohort report | Enrolment, retention, attendance, completion, at risk |
| 01:30-01:55 | Youth | Each youth, No account, computed on read |
| 01:55-02:24 | Youth report | Learning, attendance, mentoring without notes |
| 02:24-02:51 | Progress board | Every youth by every module; a phone |
| 02:51-03:16 | Exports | Exactly what the report shows, 7 days, audited |
| 03:16-03:43 | Staff activity | Caseloads, check-ins, reviews, load |
| 03:43-04:28 | Import | Group and Youth email; placed and invited once |
| 04:28-05:02 | Server rules | Gates, roles, admins invite, tenancy |
| 05:02-05:28 | Off and states | Northgate, Aisha, empty, failed |
| 05:28-05:58 | Testing | API and browser tests |
| 05:58-06:28 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend run start -- --port 4200
node tools/video-record/record-clips.mjs docs/videos/80-report-export-and-import --base http://localhost:4200
PYTHON=python3 node tools/video-audio/generate-audio.mjs docs/videos/80-report-export-and-import
node tools/video-build/build-video.mjs docs/videos/80-report-export-and-import --no-captions
```

## Pitfalls

- A child without a youth account has no learning, which is not the same as zero; the cohort average counts only youth with an account.
- Detailed exports carry names; the summary export keeps masking counts under five.
- Reviews are counted by the mentor's name on the submission's history.
- A cohort is matched by its name in this organization only; an unknown one is imported, not placed.
- Date ranges, comparisons with another cohort, PDF exports and live board updates are deferred (ADR 0074).

## References

- `docs/specs/L2.md`: L2-127 to L2-131, L2-010, L2-024, L2-025, L2-051
- `docs/adr/0074-detailed-reports-are-computed-on-read-with-sections-per-module-and-imports-place-and-invite.md`
- `docs/detailed-designs/reports/explore-reports/`, `view-cohort-report/`, `view-youth-report/`, `view-staff-report/`, `view-progress-board/`, `export-filtered-data/`, `docs/detailed-designs/imports/import-roster/`
