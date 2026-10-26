namespace PromiseHub.Application.Notifications;

public sealed record NotificationDto(Guid Id, string Kind, string Text, string Link, DateTimeOffset CreatedAt, DateTimeOffset? ReadAt);
