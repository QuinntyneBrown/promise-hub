# 13 · Resolve missing slips

> **Runtime:** ~3 min · **Audience:** contributors and product owners · **Prerequisites:** [12 · Sign a permission slip](../12-sign-a-permission-slip/README.md)

**Video:** [13-resolve-missing-slips.mp4](13-resolve-missing-slips.mp4) · [Slides](slides.html) · **Audio:** [13-resolve-missing-slips.mp3](13-resolve-missing-slips.mp3) · [Transcript](script.md)

## Why this video exists

Slice 13 ([prompt](../../prompts/13-resolve-missing-slips.md)) chases unsigned slips: scheduled reminders, the day-of view, signing on a staff tablet and a manual reminder.

## Learning objectives

By the end, the viewer can:

- explain when reminders go out and to whom;
- read the day-of check-in and clear a child on the tablet;
- send a manual reminder and spot an unreachable family.

## Key questions

| Question | What a strong answer includes |
|---|---|
| When does a reminder go? | 6 pm local on the slip's schedule, once per slot, until the sign-by date |
| Who gets it? | Families with a child who hasn't answered, each with fresh links |
| What does a tablet signature record? | The same record as the guardian's page, with the staff member on the device |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Slips/ReminderSlots.cs` | the schedule |
| `backend/src/PromiseHub.Application/Slips/SignOnTabletHandler.cs` | tablet signing |
| `docs/adr/0016-reminders-and-tablet.md` | the decision |
| `clips/bus-door-phone.mp4`, `clips/text-unsigned-desktop.mp4` | the running app with the fake API |
| `shots/*.png` | day-of and tablet |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:55 | Introduction, promises | Reminders and the day |
| 00:55-01:30 | At the bus door | Tablet signing |
| 01:30-02:00 | Text the unsigned | The reminder dialog |
| 02:00-02:10 | The screens | Day-of and tablet |
| 02:10-02:55 | Testing, recap | Coverage |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter SlipReminderTests
cd e2e; npx playwright test tests/slips/day-of.spec.ts
```

## Pitfalls

- The tablet page is a slips screen mounted under check-in, so attendance never imports slips (ADR 0016).
- Reminder copy is English until translation arrives.

## References

- [IANA time zone database](https://www.iana.org/time-zones)
