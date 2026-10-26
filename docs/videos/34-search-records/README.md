# 34 · Search records

> **Runtime:** ~2 min · **Audience:** contributors and product owners · **Prerequisites:** [33 · Monitor today's work](../33-monitor-todays-work/README.md)

**Video:** [34-search-records.mp4](34-search-records.mp4) · [Slides](slides.html) · **Audio:** [34-search-records.mp3](34-search-records.mp3) · [Transcript](script.md)

## Why this video exists

Slice 34 ([prompt](../../prompts/34-search-records.md)) lets staff find permitted children, families and events by name or phone fragment across enabled modules.

## Learning objectives

By the end, the viewer can:

- search by name, email or phone digits;
- explain how permissions and modules shape the results;
- say what happens when nothing matches or search fails.

## Key questions

| Question | What a strong answer includes |
|---|---|
| How does a phone search match? | Three or more digits, punctuation ignored |
| What does a youth worker find? | Only the children and families of her sessions |
| When are events returned? | Only with Permission slips on |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Search/SearchHandler.cs` | matching and filtering |
| `frontend/projects/households/src/lib/search/search-page.html` | the grouped results |
| `docs/adr/0028-global-search.md` | the decision |
| `clips/search-desktop.mp4` | the running app with the fake API |
| `shots/*.png` | no results and error |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:40 | Introduction, promises | What search finds |
| 00:40-01:05 | Searching | Name, then phone |
| 01:05-01:20 | No results | Empty and error |
| 01:20-01:55 | Testing, recap | Cases |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter SearchTests
cd e2e; npx playwright test tests/search
```

## Pitfalls

- Recent items in the empty state are not built yet.

## References

- [WAI-ARIA: search landmark](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/search.html)
