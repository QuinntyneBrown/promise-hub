namespace PromiseHub.Application.Attendance;

/// <summary>Where a request to the guardian stands, polled by the sign-out dialog.</summary>
public sealed record PickupRequestDto(Guid Id, Guid ChildId, string CollectorName, string Status, string? DecidedBy, DateTimeOffset? DecidedAt, Guid? IncidentId);
