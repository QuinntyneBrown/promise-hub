namespace PromiseHub.Application.Mentoring;

/// <summary>Whole points for one rubric criterion.</summary>
public sealed record GradeScore(Guid CriterionId, int Points);
