namespace PromiseHub.Application.Mentoring;

/// <summary>A cohort on the mentor's team: its role for them (Lead or Supporting) and how many youth are on its active roster.</summary>
public sealed record MentorCohortSummaryDto(Guid ProgramId, string Name, string? Term, string Role, int YouthCount);
