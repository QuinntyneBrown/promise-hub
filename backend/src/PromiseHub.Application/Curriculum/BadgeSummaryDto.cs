namespace PromiseHub.Application.Curriculum;

/// <summary>One badge in the Badges list (L2-084 criterion 1).</summary>
public sealed record BadgeSummaryDto(Guid Id, string Name, string Icon, string? Description, string Kind, string? Rule, Guid? TargetId, string? TargetTitle,
    Guid? CompetencyId, string? CompetencyName, int EarnedCount);
