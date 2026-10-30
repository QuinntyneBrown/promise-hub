namespace PromiseHub.Application.LearningBond;

/// <summary>
/// One child's Learning Bond consent in force, under Your consents (L2-152 criterion 1): who signed, when, the wording version, and the
/// provider an application went to (or is prepared for), so Withdraw can say what stays with them.
/// </summary>
public sealed record GuardianLearningBondConsentDto(Guid Id, Guid ChildId, string FirstName, string TypedName, DateTimeOffset GivenAt, int WordingVersion, string? Provider,
    bool Sent);
