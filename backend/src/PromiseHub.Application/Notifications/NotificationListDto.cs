namespace PromiseHub.Application.Notifications;

/// <summary>The caller's notifications, newest first, with how many are unread.</summary>
public sealed record NotificationListDto(int Unread, IReadOnlyList<NotificationDto> Items);
