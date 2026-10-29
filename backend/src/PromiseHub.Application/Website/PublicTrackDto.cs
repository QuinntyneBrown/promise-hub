namespace PromiseHub.Application.Website;

/// <summary>A published track with its published modules in order (L2-133 criterion 2).</summary>
public sealed record PublicTrackDto(string Name, string? Description, IReadOnlyList<PublicModuleDto> Modules);
