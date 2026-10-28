namespace PromiseHub.Application.Notifications;

/// <summary>The caller's choices to save; kinds left out keep what they had.</summary>
public sealed record SaveNotificationPreferencesRequest(IReadOnlyList<NotificationPreferenceChoice>? Kinds);
