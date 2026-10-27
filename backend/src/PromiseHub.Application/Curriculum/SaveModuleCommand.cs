namespace PromiseHub.Application.Curriculum;

public sealed record SaveModuleCommand(string? Title, string? Description, Guid? PrerequisiteModuleId, string? Anchor);
