namespace PromiseHub.Application.Learning;

/// <summary>The module holding the first lesson the youth can do next (L2-087 criterion 1).</summary>
public sealed record JourneyCurrentDto(Guid TrackId, Guid ModuleId, string ModuleTitle);
