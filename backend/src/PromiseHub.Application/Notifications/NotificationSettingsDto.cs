namespace PromiseHub.Application.Notifications;

/// <summary>The organization's notification settings, with this month's SMS segments used for context.</summary>
public sealed record NotificationSettingsDto(int NoShowDelayMinutes, bool EmailSupervisorsOnIncidents, int SmsCap, int SmsUsed);
