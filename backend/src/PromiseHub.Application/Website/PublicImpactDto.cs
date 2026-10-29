namespace PromiseHub.Application.Website;

/// <summary>Counts of programs and published content only, never of people (L2-133 criterion 4); the learning counts are null while Learning is off.</summary>
public sealed record PublicImpactDto(int Programs, int Open, int? Tracks, int? Modules);
