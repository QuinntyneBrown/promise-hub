namespace PromiseHub.Application.Enrollment;

/// <summary>The referrer's own details on a referral (L2-071).</summary>
public sealed record EnrollmentReferrerDraft(string? Name, string? Role, string? Organization);
