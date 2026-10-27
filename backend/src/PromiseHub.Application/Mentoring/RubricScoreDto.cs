namespace PromiseHub.Application.Mentoring;

/// <summary>One rubric criterion of the assignment with its points and the score the mentor saved for it, if any (L2-080 criterion 2).</summary>
public sealed record RubricScoreDto(Guid Id, string Description, int Points, int? Score);
