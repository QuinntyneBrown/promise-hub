namespace PromiseHub.Application.Mentoring;

/// <summary>One mentor check-in as its author reads it (L2-090), dates as yyyy-MM-dd.</summary>
public sealed record MentorCheckInDto(
    Guid Id,
    Guid ChildId,
    string YouthName,
    string Date,
    string Kind,
    string Engagement,
    string? Topics,
    string? ActionItems,
    string? PrivateNotes,
    string? FollowUpOn,
    bool Shared,
    bool GuardianInformed,
    DateTimeOffset CreatedAt);
