namespace PromiseHub.Application.Mentoring;

/// <summary>A cohort on the signed-in mentor's team, and whether they lead it.</summary>
public sealed record MentorCohortRef(Guid ProgramId, bool IsLead);
