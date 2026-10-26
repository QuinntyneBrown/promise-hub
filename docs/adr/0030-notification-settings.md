# 0030: Notification settings are one optional row per organization, read by jobs on every run

- Status: accepted
- Date: 2026-10-26

## Context

Prompt 36 asks an admin to set reminder, no-show and messaging preferences (`L2-040`, `L2-034`). The no-show delay was a constant (ADR 0022), the SMS cap came from the plan, and incident emails always went to directors.

## Decision

- **Model.** `NotificationSettings` (tenant-owned, unique per organization) holds the no-show delay, whether supervisors are emailed on new incidents, and the SMS cap. Without a row, the defaults apply: 15 minutes, on, the plan's cap.
- **API.** `GET`/`PUT /settings/notifications` under `ManageSettings`. A delay outside 5 to 60 minutes, or a cap below this month's used segments, is refused per field. Saving is audited and also changes the current month's cap.
- **Jobs.** `NotificationSettingsReader` gives handlers the effective values. The dispatch runner looks at sessions past the shortest allowed delay (5 minutes) and each tenant's `SendNoShowAlertsHandler` applies its own delay. `SmsCap` starts a month at the organization's cap. `ReportIncidentHandler` skips supervisor emails when switched off; in-app notices still go out.
- **Frontend.** `NOTIFICATION_SETTINGS_API`; `SettingsNotificationsPage` at `/settings/notifications` in the `settings` library, linked from the Settings tabs.

## Consequences

The mock's slip reminder default, default channel, bounce emails and weekly summary are not built; slips keep their own reminder schedule.
