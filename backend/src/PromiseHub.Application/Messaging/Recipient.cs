using PromiseHub.Domain.Messaging;

namespace PromiseHub.Application.Messaging;

/// <summary>One household of an audience: where the chosen channel reaches it, or why it cannot.</summary>
public sealed record Recipient(
    Guid HouseholdId,
    string Household,
    string? Guardian,
    string Language,
    Channel Channel,
    string? To,
    string? FallbackEmail,
    string? Unreachable);
