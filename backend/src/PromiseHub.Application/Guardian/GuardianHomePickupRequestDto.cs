namespace PromiseHub.Application.Guardian;

/// <summary>Someone waiting to collect a child, for the guardian to approve or refuse.</summary>
public sealed record GuardianHomePickupRequestDto(Guid Id, string Child, string Collector, string Event, DateTimeOffset RequestedAt);
