# 91 · Report Learning Bond outcomes

> **Runtime:** ~3.4 min · **Audience:** program directors, admins, funders' liaisons, contributors and product owners · **Prerequisites:** [85 · Launch Learning Bond invitations](../85-launch-learning-bond-invitations/README.md)

**Video:** [91-report-learning-bond-outcomes.mp4](91-report-learning-bond-outcomes.mp4) · [Slides](slides.html) · **Audio:** [91-report-learning-bond-outcomes.mp3](91-report-learning-bond-outcomes.mp3) · [Transcript](script.md)

## Why this video exists

Slice 91 shows an organization what the Learning Bond achieved:

- Six figures, computed on read over its covered households, with dollars split into Learning Bond and benefits.
- Filters by covered program and period.
- Fewer than 5 masked and its dollars withheld.
- A funder CSV per program with a total row, kept 7 days and audited, never naming a family.

The requirements are `L2-141` and `L2-143`, with ADR 0084.

## Learning objectives

By the end, the viewer can:

- Read the six figures and their split.
- Say why a figure reads Fewer than 5, and what is withheld.
- Export for funders, and say what the CSV holds and for how long.
- Say who sees the dashboard.

## Key questions

| Question | What a strong answer includes |
|---|---|
| What are the figures? | Households invited, started and completed; children with a submitted Learning Bond application; estimated dollars unlocked and confirmed dollars deposited, each split into Learning Bond and benefits. They are computed on read over the tenant's covered households (`LearningBondFigures`). |
| When is a figure masked? | A count from 1 to 4 reads Fewer than 5 (or "<5" in the CSV). Dollars are withheld when the households they rest on (started or completed) number 1 to 4. Zero is shown. |
| What does the export hold? | One row per covered program and a total, with the same columns plus confirmed dollars per completed household. It is a `ReportExport` kept 7 days (410 after) and audited. It has no name, contact, date of birth or identifier. |
| Who sees it? | `ViewReports`: admins, program directors and site leads. Others get 403. With the module off, 404. |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/LearningBond/LearningBondFigures.cs`, `LearningBondDashboardHandler.cs` | The figures, suppression and the export |
| `backend/src/PromiseHub.Api/Endpoints/LearningBondEndpoints.cs` | `ViewReports` behind the module gate |
| `frontend/projects/learning-bond/src/lib/dashboard/` | The dashboard and the export dialog |
| `shots/desktop-dashboard.png`, `desktop-programs.png`, `desktop-last-30-days.png`, `desktop-export.png`, `desktop-export-ready.png` | On a laptop |
| `shots/phone-dashboard.png`, `phone-programs.png`, `desktop-forbidden.png` | On a phone, and a youth worker |
| `clips/dashboard-desktop.mp4`, `dashboard-phone.mp4`, `forbidden-desktop.mp4` | Screen recordings of the running app against a fake API |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00 | Introduction | Counts and sums, never a family |
| 00:21 | The dashboard | Six figures, split |
| 00:56 | By program | Fewer than 5; filters |
| 01:27 | Export | The funder CSV |
| 01:57 | Phone and roles | One column; report roles only |
| 02:22 | Testing | API and browser tests |
| 02:58 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend run start -- --port 4317
node tools/video-record/record-clips.mjs docs/videos/91-report-learning-bond-outcomes --base http://localhost:4317
node tools/video-audio/generate-audio.mjs docs/videos/91-report-learning-bond-outcomes
node tools/video-build/build-video.mjs docs/videos/91-report-learning-bond-outcomes --no-captions
```

## Pitfalls

- Site leads hold `ViewReports`, as they do for every report. The forbidden case is a role without it, such as a youth worker (ADR 0084).
- A view across organizations for funders is deferred: it would cross the tenant boundary.

## References

- `docs/specs/L2.md`: L2-141, L2-143, L2-024, L2-025
- `docs/adr/0084-learning-bond-figures-are-computed-on-read-and-suppressed-where-they-rest-on-few-households.md`
- `docs/detailed-designs/learning-bond/view-dashboard-and-export/README.md`
