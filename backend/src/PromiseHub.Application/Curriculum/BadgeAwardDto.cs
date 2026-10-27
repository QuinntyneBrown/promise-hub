namespace PromiseHub.Application.Curriculum;

/// <summary>A youth who holds a badge, when, and who awarded it (null when the server did).</summary>
public sealed record BadgeAwardDto(Guid Id, Guid MembershipId, string YouthName, DateTimeOffset AwardedAt, string? AwardedBy);
