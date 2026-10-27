namespace PromiseHub.Application.Enrollment;

/// <summary>The draft to continue: <see cref="Contact"/> is the verified contact as typed back, for the referrer's step.</summary>
public sealed record EnrollmentDraftDto(
    bool Returning,
    string Language,
    string Program,
    EnrollmentHouseholdDraft Household,
    IReadOnlyList<EnrollmentChildDraft> Children,
    string Contact,
    string ApplyingAs = "Guardian",
    EnrollmentReferrerDraft? Referrer = null,
    string? Reason = null);
