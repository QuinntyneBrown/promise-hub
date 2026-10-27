namespace PromiseHub.Application.Curriculum;

/// <summary>A progression stage as the stage dialog sends it (L2-086 criterion 2).</summary>
public sealed record StageCommand(string? Name, string? Description);
