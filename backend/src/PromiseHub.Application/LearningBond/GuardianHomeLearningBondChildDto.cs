namespace PromiseHub.Application.LearningBond;

/// <summary>One covered child on the guardian home's Learning Bond card: Invited until a consent starts the claim, then the claim's status.</summary>
public sealed record GuardianHomeLearningBondChildDto(Guid Id, string FirstName, string Status);
