namespace PromiseHub.Application.LearningBond;

/// <summary>A child the benefits intake reuses from the Learning Bond (L2-154 criterion 1), with who claims them when asked.</summary>
public sealed record BenefitsIntakeChildDto(Guid Id, string FirstName, int? Age, string? Claims);
