using PromiseHub.Domain.Curriculum;

namespace PromiseHub.Application.Curriculum;

/// <summary>A badge's fields once <see cref="BadgeRules"/> accepted them.</summary>
public sealed record BadgeFields(string Name, string Icon, string? Description, BadgeKind Kind, BadgeRule? Rule, Guid? TargetId, Guid? CompetencyId);
