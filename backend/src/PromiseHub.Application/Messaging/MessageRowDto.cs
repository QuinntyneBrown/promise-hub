namespace PromiseHub.Application.Messaging;

public sealed record MessageRowDto(
    Guid Id,
    string Title,
    DateTimeOffset SentAt,
    string SentBy,
    int RecipientCount,
    string Audience,
    string Channel,
    string Status,
    int DeliveredCount,
    int FailedCount,
    int PausedCount);
