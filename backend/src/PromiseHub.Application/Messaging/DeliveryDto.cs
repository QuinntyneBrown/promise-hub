namespace PromiseHub.Application.Messaging;

public sealed record DeliveryDto(string Household, string? Guardian, string Channel, string Language, string Status, string? Reason, DateTimeOffset? At);
