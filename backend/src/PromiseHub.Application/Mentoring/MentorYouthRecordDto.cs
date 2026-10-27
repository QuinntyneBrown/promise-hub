namespace PromiseHub.Application.Mentoring;

/// <summary>
/// The mentor-safe record of a youth (L2-064, ADR 0049). Built field by field: it has no date of birth, medical fields, health card,
/// notes or pickups. Recent attendance is null while Roll Call is off.
/// </summary>
public sealed record MentorYouthRecordDto(
    Guid Id,
    string Name,
    string? PreferredName,
    string? Pronouns,
    int? Age,
    string? School,
    IReadOnlyList<string> Programs,
    string? Mentor,
    IReadOnlyList<MentorGuardianContactDto> Guardians,
    IReadOnlyList<MentorAttendanceDto>? RecentAttendance);
