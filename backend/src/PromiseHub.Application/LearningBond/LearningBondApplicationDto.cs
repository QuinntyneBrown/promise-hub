namespace PromiseHub.Application.LearningBond;

/// <summary>
/// The review (learning-bond-review, L2-148): the provider and why, the providers serving the province to choose from, the review version
/// Submit quotes, and the fields. NoProvider when none serves the province.
/// </summary>
public sealed record LearningBondApplicationDto(Guid Id, string Language, string Organization, string Explanation, Guid ChildId, string FirstName, string Status,
    int ReviewVersion, string Province, string? Provider, string Reason, IReadOnlyList<string> Providers, bool NoProvider, LearningBondApplicationFieldsDto Fields);
