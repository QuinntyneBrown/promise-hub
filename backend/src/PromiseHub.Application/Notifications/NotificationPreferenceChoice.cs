namespace PromiseHub.Application.Notifications;

/// <summary>One choice in a save: the kind and whether it reaches the caller in the app.</summary>
public sealed record NotificationPreferenceChoice(string? Key, bool InApp);
