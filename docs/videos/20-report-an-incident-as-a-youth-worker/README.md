# 20 · Report an incident as a youth worker

> **Runtime:** ~2 min · **Audience:** contributors and product owners · **Prerequisites:** [19 · Report an incident](../19-report-an-incident/README.md)

**Video:** [20-report-an-incident-as-a-youth-worker.mp4](20-report-an-incident-as-a-youth-worker.mp4) · [Slides](slides.html) · **Audio:** [20-report-an-incident-as-a-youth-worker.mp3](20-report-an-incident-as-a-youth-worker.mp3) · [Transcript](script.md)

## Why this video exists

Slice 20 ([prompt](../../prompts/20-report-an-incident-as-youth-worker.md)) proves a youth worker reports an incident but never reads other people's reports.

## Learning objectives

By the end, the viewer can:

- report an incident as a youth worker;
- explain why another person's report answers 404, not 403.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Is the form different for youth workers? | No; same facts, same routing |
| What does a link to another report answer? | 404, so its existence is not disclosed |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Incidents/IncidentAccess.cs` | the access rule |
| `docs/adr/0021-incident-reporting.md` | not found, not forbidden |
| `clips/aisha-report-phone.mp4` | the running app with the fake API |
| `shots/*.png` | own reports, not found |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:40 | Introduction, promises | Same form, own reports |
| 00:40-01:00 | Aisha reports | The form to the report |
| 01:00-01:20 | What she reads | Log and not found |
| 01:20-01:50 | Testing, recap | Coverage |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter IncidentTests
cd e2e; npx playwright test tests/incidents/youth-worker.spec.ts
```

## Pitfalls

- The behaviour shipped with slice 19; slice 20 adds its acceptance tests and this video.

## References

- [OWASP: Insecure direct object references](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html)
