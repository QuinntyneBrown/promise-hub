namespace PromiseHub.Application.Guardian;

/// <summary>The household's home page: who it greets and where each child stands (page: guardian-home).</summary>
public sealed record GuardianHomeDto(string Language, string Organization, string? Phone, string FirstName, IReadOnlyList<GuardianHomeChildDto> Children);
