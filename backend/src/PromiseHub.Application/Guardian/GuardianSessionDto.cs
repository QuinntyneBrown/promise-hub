namespace PromiseHub.Application.Guardian;

/// <summary>A session on a child's guardian page: Scheduled or Cancelled, and whether it is on the organization's today (L2-102 criterion 2).</summary>
public sealed record GuardianSessionDto(Guid EventId, string Name, string Program, DateTimeOffset StartsAt, DateTimeOffset EndsAt, string? Place, string Status, bool Today);
