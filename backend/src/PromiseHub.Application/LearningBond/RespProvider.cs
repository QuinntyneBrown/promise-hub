namespace PromiseHub.Application.LearningBond;

/// <summary>
/// A no-fee RESP provider that administers the Learning Bond (L2-148 criterion 1): no fee to open or hold an RESP with no contribution, the
/// provinces it serves, its submission channel, and the days it states from submission to deposit (L2-150 criterion 1).
/// </summary>
public sealed record RespProvider(string Name, IReadOnlyList<string> Provinces, string Channel, int ProcessingDaysMin, int ProcessingDaysMax)
{
    public bool NoFee => true;

    public bool AdministersLearningBond => true;
}
