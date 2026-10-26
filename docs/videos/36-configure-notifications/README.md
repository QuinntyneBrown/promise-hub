# 36 · Configure notifications

> **Runtime:** ~2 min · **Audience:** contributors and product owners · **Prerequisites:** [35 · Review notifications](../35-review-notifications/README.md)

**Video:** [36-configure-notifications.mp4](36-configure-notifications.mp4) · [Slides](slides.html) · **Audio:** [36-configure-notifications.mp3](36-configure-notifications.mp3) · [Transcript](script.md)

## Why this video exists

Slice 36 ([prompt](../../prompts/36-configure-notifications.md)) lets an admin set the no-show delay, supervisor incident emails and the SMS cap, and makes the jobs follow them.

## Learning objectives

By the end, the viewer can:

- name the settings and their defaults;
- explain how the jobs pick up a change;
- say what is refused when saving.

## Key questions

| Question | What a strong answer includes |
|---|---|
| When does a new delay apply? | On the job's next run; each tenant's handler reads it |
| What does switching supervisor emails off do? | Stops the email; the in-app notice still arrives |
| Why can't the cap be lowered freely? | It can't go below this month's used segments |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Notifications/NotificationSettingsHandler.cs` | validation and save |
| `backend/src/PromiseHub.Application/Attendance/SendNoShowAlertsHandler.cs` | the delay in the job |
| `docs/adr/0030-notification-settings.md` | the decision |
| `clips/settings-desktop.mp4` | the running app with the fake API |
| `shots/*.png` | forbidden and phone |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:50 | Introduction, promises | Defaults and rules |
| 00:50-01:15 | Changing them | Delay and cap |
| 01:15-01:30 | Who | Forbidden and phone |
| 01:30-02:05 | Testing, recap | Cases |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter NotificationSettingsTests
cd e2e; npx playwright test tests/settings/notifications.spec.ts
```

## Pitfalls

- Slip reminder defaults, default channel, bounce emails and the weekly summary from the mock are not built.

## References

- [WCAG 2.2: Error identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification)
