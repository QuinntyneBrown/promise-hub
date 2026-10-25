namespace PromiseHub.Application.Households;

/// <summary>A child in a household. <see cref="MedicalFlag"/> is null for roles without medical access.</summary>
public sealed record ChildSummaryDto(Guid Id, string Name, int? Age, string? School, string? MedicalFlag);
