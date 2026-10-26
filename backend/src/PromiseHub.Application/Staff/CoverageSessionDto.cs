namespace PromiseHub.Application.Staff;

/// <summary>An upcoming session with who works it; a gap when no one does.</summary>
public sealed record CoverageSessionDto(Guid Id, string Name, DateTimeOffset StartsAt, DateTimeOffset EndsAt, string? Place, IReadOnlyList<CoveragePersonDto> Staff, bool Gap);
