namespace PromiseHub.Application.LearningBond;

/// <summary>
/// An application as it goes to a provider (L2-149): the only place the SINs are decrypted, on the guardian's Submit, and never logged. The key
/// lets the provider recognise a repeat.
/// </summary>
public sealed record RespSubmission(Guid Key, string Provider, string Channel, string BeneficiaryName, DateOnly? DateOfBirth, string ChildSin, string CaregiverName,
    string GuardianSin, string Address, string? Phone, string? Email, string Language)
{
    /// <summary>Never the SINs, should a submission ever be written out.</summary>
    public override string ToString() => $"RespSubmission {{ Key = {Key}, Provider = {Provider} }}";
}
