namespace PromiseHub.Application.LearningBond;

/// <summary>
/// The answer of a signer's link: the value while it is open, the field errors when it is refused, and the organization's name when it has
/// expired, so the page can say whom to ask; an unknown link names no one (L2-137 criterion 9).
/// </summary>
public sealed record LearningBondSignerOutcome<T>(LearningBondSignerLinkStatus Status, T? Value = default, string? Organization = null,
    IReadOnlyDictionary<string, string>? Errors = null)
{
    public static LearningBondSignerOutcome<T> Unknown { get; } = new(LearningBondSignerLinkStatus.Unknown);

    public static LearningBondSignerOutcome<T> Expired(string organization) => new(LearningBondSignerLinkStatus.Expired, Organization: organization);

    /// <summary>"This link has expired. Ask {organization} to send a new one."</summary>
    public string? Message => Organization is null ? null : $"This link has expired. Ask {Organization} to send a new one.";
}
