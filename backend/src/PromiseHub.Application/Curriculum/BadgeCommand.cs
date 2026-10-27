namespace PromiseHub.Application.Curriculum;

/// <summary>A badge as the builder sends it (L2-084): kind Automatic or Manual; rule and target only for an automatic badge.</summary>
public sealed record BadgeCommand(string? Name, string? Icon, string? Description, string? Kind, string? Rule, Guid? TargetId, Guid? CompetencyId);
