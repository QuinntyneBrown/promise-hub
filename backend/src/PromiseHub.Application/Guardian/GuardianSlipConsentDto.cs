namespace PromiseHub.Application.Guardian;

/// <summary>A sent permission slip for one of the child's coming events: Signed, Declined or NotSigned (L2-104 criterion 2).</summary>
public sealed record GuardianSlipConsentDto(Guid EventId, string Event, DateTimeOffset StartsAt, DateOnly SignBy, string Status, string? SignedBy, DateTimeOffset? At);
