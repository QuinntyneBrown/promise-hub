namespace PromiseHub.Application.LearningBond;

/// <summary>The facts a benefit rule reads (L2-154): the household's answers and the children it may claim for, by first name and age.</summary>
public sealed record BenefitHousehold(BenefitAnswers Answers, IReadOnlyList<(string FirstName, int Age)> Children);
