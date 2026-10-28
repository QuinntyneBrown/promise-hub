namespace PromiseHub.Application.Notifications;

/// <summary>The kinds the caller may choose, in a fixed order.</summary>
public sealed record NotificationPreferencesDto(IReadOnlyList<NotificationPreferenceDto> Kinds);
