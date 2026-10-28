namespace PromiseHub.Application.Mentoring;

/// <summary>Logging a mentor check-in (L2-090 criterion 2): dates as yyyy-MM-dd, kind and engagement by name.</summary>
public sealed record LogMentorCheckInRequest(
    Guid? ChildId,
    string? Date,
    string? Kind,
    string? Engagement,
    string? Topics,
    string? ActionItems,
    string? PrivateNotes,
    string? FollowUpOn,
    bool Shared,
    bool GuardianInformed);
