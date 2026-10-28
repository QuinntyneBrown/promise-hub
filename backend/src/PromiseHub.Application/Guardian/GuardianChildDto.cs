namespace PromiseHub.Application.Guardian;

/// <summary>A child's guardian page (`guardian-child`, L2-102, L2-104): never lesson content, answers, reflections or mentor notes.</summary>
public sealed record GuardianChildDto(string Language, string Organization, string? Phone, string Name, string FirstName, IReadOnlyList<string> Programs,
    IReadOnlyList<GuardianSessionDto> Schedule, GuardianConsentsDto Consents);
