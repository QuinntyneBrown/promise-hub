namespace PromiseHub.Application.Mentoring;

/// <summary>A saved grade: the submission's status, its points once accepted and its new version.</summary>
public sealed record GradeOutcomeDto(string Status, int? Points, int Version);
