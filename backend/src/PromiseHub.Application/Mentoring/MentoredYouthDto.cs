namespace PromiseHub.Application.Mentoring;

/// <summary>A youth in the mentor's scope: name, age (never the date of birth) and the names of their active, non-archived programs.</summary>
public sealed record MentoredYouthDto(Guid Id, string Name, int? Age, IReadOnlyList<string> Programs);
