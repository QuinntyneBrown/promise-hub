namespace PromiseHub.Application.Staff;

/// <summary>Staff coverage for the next 14 days (page: coverage) and the people who can be assigned.</summary>
public sealed record CoverageDto(IReadOnlyList<CoverageSessionDto> Sessions, IReadOnlyList<CoveragePersonDto> People);
