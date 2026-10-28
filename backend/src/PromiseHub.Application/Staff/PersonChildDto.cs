namespace PromiseHub.Application.Staff;

/// <summary>The child record a youth account follows; <see cref="Deleted"/> once its household is deleted (ADR 0070).</summary>
public sealed record PersonChildDto(Guid Id, string Name, int? Age, string Household, Guid HouseholdId, bool Deleted);
