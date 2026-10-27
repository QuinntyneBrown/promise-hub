namespace PromiseHub.Application.Curriculum;

public sealed record CreateModuleCommand(Guid TrackId, string? Title, string? Description);
