namespace PromiseHub.Application.Curriculum;

public sealed record CreateTrackCommand(string? Name, string? Key, string? Description, bool Publish);
