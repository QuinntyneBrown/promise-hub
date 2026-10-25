# 25 · Run check-in offline

> **Runtime:** ~2 min · **Audience:** contributors and product owners · **Prerequisites:** [24 · End a session](../24-end-a-session/README.md)

**Video:** [25-run-check-in-offline.mp4](25-run-check-in-offline.mp4) · [Slides](slides.html) · **Audio:** [25-run-check-in-offline.mp3](25-run-check-in-offline.mp3) · [Transcript](script.md)

## Why this video exists

Slice 25 ([prompt](../../prompts/25-run-check-in-offline.md)) keeps check-in and Quick Cards working without signal and syncs queued actions when it returns.

## Learning objectives

By the end, the viewer can:

- explain what the phone keeps and when;
- follow a check-in made offline until it syncs;
- explain how a conflict is resolved.

## Key questions

| Question | What a strong answer includes |
|---|---|
| What is saved on the phone? | The last today list, each roster and every Quick Card on it, with the time saved |
| How does the queue send? | In order on the `online` event, stopping at the first failure; replays are applied once |
| What wins in a conflict? | Present; both events are kept and the row is flagged |

## Code / assets on screen

| File | What to show |
|---|---|
| `frontend/projects/api/src/lib/offline/offline-store.ts` | the saved copies and the queue |
| `frontend/projects/api/src/lib/attendance/http-attendance-api.ts` | cached reads, queued writes, sync |
| `docs/adr/0023-offline-check-in.md` | the decision |
| `clips/offline-phone.mp4` | the running app with the fake API |
| `shots/*.png` | Quick Card and nothing saved |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:55 | Introduction, promises | What is kept |
| 00:55-01:20 | No signal | Queue and sync |
| 01:20-01:40 | Edge cases | Card, nothing saved, conflict |
| 01:40-02:20 | Testing, recap | Coverage |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter OfflineSyncTests
cd e2e; npx playwright test tests/attendance/offline.spec.ts
```

## Pitfalls

- The app must already be open: there is no service worker yet (ADR 0023).

## References

- [MDN: Navigator.onLine and the online event](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine)
