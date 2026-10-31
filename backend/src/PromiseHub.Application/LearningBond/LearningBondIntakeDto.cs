namespace PromiseHub.Application.LearningBond;

/// <summary>
/// One child's intake (learning-bond-intake, L2-146): the record to confirm, the tax year asked about, and what is already answered, SINs
/// only as their last three digits. Never a whole SIN.
/// </summary>
public sealed record LearningBondIntakeDto(string Language, string Organization, string Explanation, Guid ChildId, string FirstName, string ChildName,
    DateOnly? DateOfBirth, int TaxYear, string? GuardianSin, string? ChildSin, string? TaxFiled, bool RecordFixRequested);
