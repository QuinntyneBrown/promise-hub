namespace PromiseHub.Application.Enrollment;

/// <summary>
/// What the person applying has entered so far: the household and the children to enroll. <see cref="ApplyingAs"/> is
/// Guardian (or missing), Youth or Referrer (L2-071); for a young person or a referral the household is the young person's
/// guardian and the children list holds the one young person.
/// </summary>
public sealed record EnrollmentDraft(
    EnrollmentHouseholdDraft Household,
    IReadOnlyList<EnrollmentChildDraft> Children,
    string? ApplyingAs = null,
    EnrollmentReferrerDraft? Referrer = null,
    string? Reason = null);
