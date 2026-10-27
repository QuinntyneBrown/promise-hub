namespace PromiseHub.Application.Mentoring;

/// <summary>How a mentor reaches one of a youth's guardians.</summary>
public sealed record MentorGuardianContactDto(string Name, string Relationship, string? Mobile, string? Email, bool IsPrimary);
