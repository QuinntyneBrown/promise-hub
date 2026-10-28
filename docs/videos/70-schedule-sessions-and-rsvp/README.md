# 70 · Schedule sessions and RSVP

> **Runtime:** ~5.5 min · **Audience:** program directors, youth, developers · **Prerequisites:** [05 · Create programs and events](../05-create-programs-and-events/README.md), [54 · Manage cohorts](../54-manage-cohorts/README.md)

**Video:** [70-schedule-sessions-and-rsvp.mp4](70-schedule-sessions-and-rsvp.mp4) · [Slides](slides.html) · **Audio:** [70-schedule-sessions-and-rsvp.mp3](70-schedule-sessions-and-rsvp.mp3) · [Transcript](script.md)

## Why this video exists

Sessions are where attendance and mentoring happen. Prompt 70 lets staff schedule a cohort's sessions as events, including a session that repeats every week through the program's last day, browse every program's sessions on a month calendar, and lets youth answer Going, Maybe or Can't make it with a note that staff read on the event (`L2-093`, `L2-094`, ADR 0064). It extends events; there is no second calendar.

## Learning objectives

By the end, the viewer can:

- Schedule a weekly session and say how far it repeats and what the server refuses.
- Browse the calendar by month and program, on a laptop and a phone.
- RSVP as a youth with a note, and say when RSVPs close.
- Read the RSVP counts and notes on an event, and say who counts as no reply.

## Key questions

| Question | What a strong answer includes |
|---|---|
| What does Repeat weekly create? | One ordinary event a week at the same local time through the program's last day, sharing a series; at most 60 |
| How does the calendar decide a session's day? | The server sends each event's day in the organization's time zone |
| What can a youth answer? | Going, Maybe or Can't make it, with an optional note of at most 500 characters, for sessions of her programs |
| When do RSVPs close? | When the session starts, ends or is cancelled (409) |
| Who counts as no reply? | Youth on the program's active roster who sign in and have not answered |
| What is audited? | The series once with its count; each RSVP with its answer, never the note |

## Code / assets on screen

| File | What to show |
|---|---|
| `frontend/projects/events/src/lib/event-form-page/` | Repeat weekly and the toast |
| `frontend/projects/events/src/lib/events-calendar-page/` | The calendar page, month and program in the address |
| `frontend/projects/components/src/lib/calendar/` | `ph-calendar`: the month grid and the phone agenda |
| `frontend/projects/events/src/lib/youth-schedule-page/`, `rsvp-dialog/` | Sofía's schedule and the RSVP dialog |
| `frontend/projects/events/src/lib/event-page/` | The RSVPs card |
| `backend/src/PromiseHub.Domain/Events/WeeklySeries.cs`, `EventRsvp.cs` | Weekly starts; one RSVP per event and youth |
| `backend/src/PromiseHub.Application/Events/CreateEventHandler.cs`, `EventCalendarHandler.cs`, `YouthScheduleHandler.cs`, `RsvpHandler.cs`, `EventRsvpSummary.cs` | The series, the calendar, the schedule, RSVPs, the counts |
| `backend/tests/PromiseHub.Api.Tests/ScheduleSessionsTests.cs`, `EventCalendarTests.cs`, `YouthScheduleTests.cs`, `EventRsvpsTests.cs` | API acceptance tests |
| `e2e/tests/events/schedule-sessions.spec.ts`, `calendar.spec.ts`, `youth-schedule.spec.ts`, `event-rsvps.spec.ts` | Browser acceptance tests |
| `shots/` | Events, the weekly form and created event, calendar (filtered, empty, error), schedule, RSVP, sent, RSVPs, invalid, failed, closed, cancelled, error, consent required, Roster off; phone and desktop |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:22 | Introduction | Sessions and who is coming |
| 00:22-00:58 | Weekly | Tutoring night every Thursday, 33 sessions |
| 00:58-01:36 | Server | Local time, last day, limits, slips, audit |
| 01:36-02:14 | Calendar | November by week, the program filter |
| 02:14-02:48 | Schedule | Sofía's RSVP with a note |
| 02:48-03:21 | Checks | Answers, closed sessions, scope, consent, audit |
| 03:21-03:44 | Answers | The RSVPs card |
| 03:44-03:56 | Phone | The agenda, the schedule, the sheet |
| 03:56-04:33 | States | Invalid, failed, closed, error, consent required, Roster off |
| 04:33-05:02 | Testing | API and browser tests |
| 05:02-05:27 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend start
node tools/video-record/record-clips.mjs docs/videos/70-schedule-sessions-and-rsvp --base http://localhost:4200
node tools/video-audio/generate-audio.mjs docs/videos/70-schedule-sessions-and-rsvp
node tools/video-build/build-video.mjs docs/videos/70-schedule-sessions-and-rsvp --no-captions
```

## Pitfalls

- Expecting an edit to change the whole series: editing or cancelling changes one session (deferred, ADR 0064).
- Expecting a reminder before the session: deferred to near-real-time notifications (prompt 75).
- Looking for Schedule as a staff member: it is a youth section; staff read RSVPs on the event.

## References

- [`L2-093`, `L2-094`](../../specs/L2.md) · [ADR 0064](../../adr/0064-weekly-sessions-are-a-series-of-events-and-an-rsvp-is-one-row-per-event-and-youth.md) · Designs: [schedule-sessions](../../detailed-designs/events/schedule-sessions/README.md), [browse-calendar](../../detailed-designs/events/browse-calendar/README.md), [rsvp-to-session](../../detailed-designs/events/rsvp-to-session/README.md)
