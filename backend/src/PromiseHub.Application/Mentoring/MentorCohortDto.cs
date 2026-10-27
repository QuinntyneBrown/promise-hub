namespace PromiseHub.Application.Mentoring;

/// <summary>A cohort on the mentor's team (L2-065 criterion 1): their role, the team by name and the active roster.</summary>
public sealed record MentorCohortDto(
    Guid ProgramId,
    string Name,
    string? Term,
    string? Schedule,
    string Role,
    string? Lead,
    IReadOnlyList<string> Supporting,
    IReadOnlyList<MentorCohortMemberDto> Members);
