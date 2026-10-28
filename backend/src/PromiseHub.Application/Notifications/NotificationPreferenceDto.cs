namespace PromiseHub.Application.Notifications;

/// <summary>One kind a member may choose, with its name, what it covers and whether it reaches them in the app.</summary>
public sealed record NotificationPreferenceDto(string Key, string Name, string Hint, bool InApp);
