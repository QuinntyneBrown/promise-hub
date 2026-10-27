namespace PromiseHub.Application.Curriculum;

/// <summary>A competency as the competency dialog sends it (L2-086 criterion 4).</summary>
public sealed record CompetencyCommand(string? Name, string? Description);
