namespace PromiseHub.Application.Curriculum;

/// <summary>An active youth of the organization who can still be awarded a badge.</summary>
public sealed record BadgeYouthDto(Guid MembershipId, string Name);
