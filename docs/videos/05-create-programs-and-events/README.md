# 05 · Create programs and events

> **Runtime:** ~3 min · **Audience:** contributors and product owners · **Prerequisites:** [04 · Maintain households](../04-maintain-households/README.md)

**Video:** [05-create-programs-and-events.mp4](05-create-programs-and-events.mp4) · [Slides](slides.html) · **Audio:** [05-create-programs-and-events.mp3](05-create-programs-and-events.mp3) · [Transcript](script.md)

## Why this video exists

Slice 05 ([prompt](../../prompts/05-create-programs-and-events.md)) builds the programs and events that sessions, check-in and slips hang off.

## Learning objectives

By the end, the viewer can:

- create a program and manage its roster within capacity;
- archive and restore a program and say what is kept;
- create and cancel events and explain the draft slip.

## Key questions

| Question | What a strong answer includes |
|---|---|
| What state does a new program start in? | Nobody enrolled, enrollment closed unless opened |
| What does archiving keep? | Roster, events and attendance; it can be restored |
| What happens when an event needs a slip? | A draft slip is created with it |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Programs/EnrollChildHandler.cs` | the capacity check |
| `backend/src/PromiseHub.Application/Programs/ArchiveProgramHandler.cs` | typed name, enrollment closed |
| `backend/src/PromiseHub.Application/Events/CreateEventHandler.cs` | the draft slip |
| `clips/programs-desktop.mp4`, `clips/cancel-event-phone.mp4` | the running app with the fake API |
| `shots/*.png` | programs list and an archived program |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:45 | Introduction, promises | What programs and events guarantee |
| 00:45-01:20 | Marisol sets up a program | Spring Robotics, Amara joins |
| 01:20-01:45 | Archive and restore | Typed name, read-only, restore |
| 01:45-02:20 | Events and their slips | Filters, draft slip, cancel on a phone |
| 02:20-03:10 | Roles, testing, recap | Who can do what, test coverage |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter ProgramsAndEventsTests
cd e2e; npx playwright test tests/programs tests/events
```

## Pitfalls

- Programs and events are Roster data on the server but follow Permission slips in navigation (ADR 0006, ADR 0008).
- Event times are stored as instants and shown in the viewer's time zone.

## References

- [HTML datetime-local input](https://developer.mozilla.org/docs/Web/HTML/Element/input/datetime-local)
