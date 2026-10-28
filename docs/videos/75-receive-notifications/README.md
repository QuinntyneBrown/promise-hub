# 75 · Receive notifications in real time

> **Runtime:** ~5.5 min · **Audience:** youth, mentors, program directors, developers · **Prerequisites:** [35 · Review notifications](../35-review-notifications/README.md), [36 · Configure notifications](../36-configure-notifications/README.md), [74 · Announce and message](../74-announce-and-message/README.md)

**Video:** [75-receive-notifications.mp4](75-receive-notifications.mp4) · [Slides](slides.html) · **Audio:** [75-receive-notifications.mp3](75-receive-notifications.mp3) · [Transcript](script.md)

## Why this video exists

Prompt 75 brings Waypoint's notifications, near-real-time notification delivery and notification preferences into PromiseHub (`L2-109` to `L2-111`, ADR 0069). The notification center serves youth and mentors as well as staff; assigned work, direct messages and announcements notify the right people; a new notice reaches the open app through a contentless event; and each person chooses which kinds reach them. Nothing of a module that is off is created, listed or offered.

## Learning objectives

By the end, the viewer can:

- Say which actions notify whom, and which modules each kind needs.
- Explain how a notice and a read reach every open device without carrying content.
- Choose which kinds reach them, and say what turning one off changes.
- Name what the center and the preferences show while Messages is off.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Who hears of a direct message? | The other participant only, with the sender's name and never the words |
| What does the stream send for a notice? | A `notification` event with no content to the recipient, and to the reader's other devices after a read |
| What does turning a kind off do? | No new notice of that kind for that person; others still get theirs; past notices stay; audited |
| What happens while Messages is off? | Message and announcement notices are not created, listed or counted, and their switches are not offered |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Notifications/NotificationKinds.cs` | Each kind's modules, who receives it, its name and hint |
| `backend/src/PromiseHub.Application/Notifications/NotificationWriter.cs` | One writer for every producer, skipping a kind turned off |
| `backend/src/PromiseHub.Infrastructure/Notifications/NotificationEvents.cs` | The save interceptor that tells the stream |
| `backend/src/PromiseHub.Application/Notifications/NotificationPreferencesHandler.cs` | Offered kinds, 422 and the audit |
| `frontend/projects/today/src/lib/notifications/` | The center with kinds, New and the quiet refetch |
| `frontend/projects/account/src/lib/notification-preferences/` | The preferences page |
| `shots/desktop-center.png`, `desktop-live.png`, `desktop-opened.png` | Sofía's center and a notice arriving |
| `shots/desktop-mentor.png`, `desktop-director.png` | Daniel's and Marisol's centers |
| `shots/desktop-preferences.png`, `desktop-saved.png`, `desktop-mentor-preferences.png` | Choosing notifications |
| `shots/phone-center.png`, `phone-preferences.png` | On a phone |
| `shots/desktop-messages-off.png`, `desktop-preferences-off.png`, `desktop-empty.png`, `desktop-error.png`, `desktop-failed.png`, `desktop-nothing.png` | States |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 0:00-0:25 | Introduction | Who needs to hear what |
| 0:25-1:00 | Center | Sofía's notices with kinds and New |
| 1:00-1:25 | Real time | Daniel writes; the notice arrives; she opens it |
| 1:25-1:55 | Sources | Assigned work, messages, announcements, one writer |
| 1:55-2:20 | Others | Daniel's and Marisol's centers |
| 2:20-2:50 | Stream | Contentless events, refetch, reconnect |
| 2:50-3:30 | Choose | Preferences per kind, saved and audited |
| 3:30-3:45 | Phone | One column |
| 3:45-4:25 | States | Messages off, empty, error, failed, nothing to choose |
| 4:25-4:55 | Testing | API and browser tests |
| 4:55-5:15 | Recap | Things to remember |

## Demo commands

```sh
cd frontend && npm run start -- --port 4200
node tools/video-record/record-clips.mjs docs/videos/75-receive-notifications
PYTHON=python3 node tools/video-audio/generate-audio.mjs docs/videos/75-receive-notifications
node tools/video-build/build-video.mjs docs/videos/75-receive-notifications --no-captions
```

## Pitfalls

- A notice never carries a message's words; the conversation endpoint checks who may read it.
- Events of one action (a `conversation` and a `notification`) are handled by name, never by their order.
- Email per kind, push, quiet hours and reminders are deferred (ADR 0069).

## References

- [Server-sent events (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [EF Core interceptors](https://learn.microsoft.com/ef/core/logging-events-diagnostics/interceptors)
