namespace PromiseHub.Application.LearningBond;

/// <summary>
/// A child on the guardian's Learning Bond page (L2-144 criteria 1 and 6): first name, age, covered programs and the "up to" amount; a child
/// aged 18 to 20 has no amount and claims for themselves. Never a SIN or an answer.
/// </summary>
public sealed record GuardianLearningBondChildDto(Guid Id, string FirstName, int? Age, IReadOnlyList<string> Programs, int? Amount, bool SelfClaim);
