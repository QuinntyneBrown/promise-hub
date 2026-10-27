namespace PromiseHub.Application.Mentoring;

/// <summary>A child on a cohort's active roster and their mentor, or none.</summary>
public sealed record YouthMentorDto(Guid ChildId, string Name, MentorOptionDto? Mentor);
