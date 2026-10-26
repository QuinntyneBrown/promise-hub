# 33 · Monitor today's work

> **Runtime:** ~2 min · **Audience:** contributors and product owners · **Prerequisites:** [32 · Use permitted child details](../32-use-permitted-child-details/README.md)

**Video:** [33-monitor-todays-work.mp4](33-monitor-todays-work.mp4) · [Slides](slides.html) · **Audio:** [33-monitor-todays-work.mp3](33-monitor-todays-work.mp3) · [Transcript](script.md)

## Why this video exists

Slice 33 ([prompt](../../prompts/33-monitor-todays-work.md)) brings sessions, missing slips, alerts and tasks into Today, composed only from modules that are on.

## Learning objectives

By the end, the viewer can:

- name the cards Today shows and where each count leads;
- explain how modules that are off shape Today;
- say what a youth worker sees instead.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Where does Today's data come from? | `GET /today` for the summary, `GET /sessions/today` for sessions |
| What happens when Slips is off? | No slips card, no unsigned count, no event links |
| Who sees review work? | Roles that may review incidents, enrollments or pickups |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Reports/TodayHandler.cs` | composing the summary |
| `frontend/projects/today/src/lib/today-page.html` | the cards |
| `docs/adr/0027-today-summary.md` | the decision |
| `clips/*.mp4` | the running app with the fake API |
| `shots/*.png` | phone and error |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:45 | Introduction, promises | One summary |
| 00:45-01:05 | Today | Everything on |
| 01:05-01:20 | Roster only | Modules off |
| 01:20-02:10 | Phone, testing, recap | Cases |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter TodayTests
cd e2e; npx playwright test tests/today
```

## Pitfalls

- Recent activity from the mock waits for the audit log.

## References

- [WCAG 2.2: Status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages)
