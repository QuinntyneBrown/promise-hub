namespace PromiseHub.Application.Messaging;

/// <summary>One message with the text as sent, its counts and the delivery to each household, problems first.</summary>
public sealed record MessageDto(
    Guid Id,
    string Title,
    string Body,
    string SmsText,
    int Characters,
    int Segments,
    DateTimeOffset SentAt,
    string SentBy,
    string Audience,
    string Channel,
    string Status,
    int RecipientCount,
    int DeliveredCount,
    int FailedCount,
    int PausedCount,
    IReadOnlyList<string> Languages,
    IReadOnlyList<DeliveryDto> Deliveries);
