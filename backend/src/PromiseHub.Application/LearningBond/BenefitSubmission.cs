namespace PromiseHub.Application.LearningBond;

/// <summary>
/// A benefit application as it goes to its program (L2-156 criterion 3): one benefit, decrypted only on the guardian's Submit, never logged.
/// The key lets the program recognise a repeat.
/// </summary>
public sealed record BenefitSubmission(Guid Key, string BenefitKey, string Program, string ApplicantName, string ApplicantSin, string MaritalStatus, int HouseholdSize,
    IReadOnlyList<string> Children, string Address, string? Phone, string? Email, string Language)
{
    /// <summary>Never the SIN, should a submission ever be written out.</summary>
    public override string ToString() => $"BenefitSubmission {{ Key = {Key}, BenefitKey = {BenefitKey} }}";
}
