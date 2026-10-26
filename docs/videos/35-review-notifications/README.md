# 35 · Review notifications

> **Runtime:** ~2 min · **Audience:** contributors and product owners · **Prerequisites:** [34 · Search records](../34-search-records/README.md)

**Video:** [35-review-notifications.mp4](35-review-notifications.mp4) · [Slides](slides.html) · **Audio:** [35-review-notifications.mp3](35-review-notifications.mp3) · [Transcript](script.md)

## Why this video exists

Slice 35 ([prompt](../../prompts/35-review-notifications.md)) lets staff open tasks, alerts and updates from the bell and the notification center.

## Learning objectives

By the end, the viewer can:

- say who is notified when an incident is reported;
- explain how read state and the unread count behave;
- explain what happens to notices when a module is off.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Who gets an incident notice? | Every current staff member whose role reviews incidents |
| When does the count update on another device? | On that device's next page |
| What does turning Incidents off do? | Hides its notices; turning it on restores them |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Notifications/NotificationWriter.cs` | one row per recipient |
| `backend/src/PromiseHub.Application/Notifications/NotificationsHandler.cs` | list, read and module filter |
| `docs/adr/0029-in-app-notifications.md` | the decision |
| `clips/notifications-desktop.mp4` | the running app with the fake API |
| `shots/*.png` | empty and error |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:45 | Introduction, promises | Who is notified |
| 00:45-01:05 | The bell | Two unread, then all read |
| 01:05-01:15 | Empty | Caught up and errors |
| 01:15-01:55 | Testing, recap | Cases |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter NotificationTests
cd e2e; npx playwright test tests/notifications
```

## Pitfalls

- The bell opens the center; the dropdown panel from the mock is not built.

## References

- [WCAG 2.2: Status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages)
