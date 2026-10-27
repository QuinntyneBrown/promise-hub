namespace PromiseHub.Application.Enrollment;

/// <summary>Who referred the young person, and the contact they verified (L2-071).</summary>
public sealed record ApplicationReferrerDto(string Name, string? Role, string? Organization, string? Contact);
