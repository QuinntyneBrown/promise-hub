namespace PromiseHub.Application.LearningBond;

/// <summary>The answers given so far: each is optional, so the intake can be left and resumed; a SIN given again replaces the one kept.</summary>
public sealed record SaveLearningBondIntakeRequest(string? GuardianSin, string? ChildSin, string? TaxFiled);
