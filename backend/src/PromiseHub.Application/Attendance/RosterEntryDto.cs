namespace PromiseHub.Application.Attendance;

/// <summary>One row of a session roster. <see cref="MedicalFlag"/> is null for roles without medical access.</summary>
public sealed record RosterEntryDto(
    Guid Id,
    Guid? ChildId,
    Guid? HouseholdId,
    string Name,
    int? Age,
    string? School,
    string? MedicalFlag,
    string Status,
    DateTimeOffset? CheckedInAt,
    bool WalkIn);
