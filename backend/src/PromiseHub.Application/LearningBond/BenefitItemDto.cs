namespace PromiseHub.Application.LearningBond;

/// <summary>
/// One benefit on learning-bond-benefits (L2-155, L2-156): exactly one state (ApplyNow, NeedDocument, NotEligible with its reason,
/// AlreadyGet, or Submitted once applied for), the yearly amount (null when it varies), the rule version and its source.
/// </summary>
public sealed record BenefitItemDto(string Key, string Name, string Level, int? Amount, string State, string? Reason, string? Document, string? DocumentFile,
    string Channel, string Source, string SourceLink, string RuleVersion, Guid? ApplicationId);
