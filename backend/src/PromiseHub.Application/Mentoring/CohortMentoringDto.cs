namespace PromiseHub.Application.Mentoring;

/// <summary>A cohort's mentor team, each roster child's mentor and the mentors that can be chosen (L2-062 criterion 1).</summary>
public sealed record CohortMentoringDto(
    Guid ProgramId,
    MentorOptionDto? Lead,
    IReadOnlyList<MentorOptionDto> Supporting,
    IReadOnlyList<YouthMentorDto> Youth,
    IReadOnlyList<MentorOptionDto> Mentors);
