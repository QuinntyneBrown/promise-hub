namespace PromiseHub.Application.LearningBond;

/// <summary>
/// A no-fee RESP provider that administers the Learning Bond (L2-148 criterion 1): no fee to open or hold an RESP with no contribution, the
/// provinces it serves, and its submission channel.
/// </summary>
public sealed record RespProvider(string Name, IReadOnlyList<string> Provinces, string Channel)
{
    public bool NoFee => true;

    public bool AdministersLearningBond => true;
}
