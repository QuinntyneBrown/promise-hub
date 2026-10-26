namespace PromiseHub.Application.Notifications;

public sealed record SaveNotificationSettingsCommand(int NoShowDelayMinutes, bool EmailSupervisorsOnIncidents, int SmsCap);
