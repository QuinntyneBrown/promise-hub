namespace PromiseHub.Application.Website;

/// <summary>A published module of a published track, with the badge completing it earns (L2-133 criterion 2).</summary>
public sealed record PublicModuleDto(string Title, string? Description, string? Badge);
