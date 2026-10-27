namespace PromiseHub.Domain.Enrollment;

/// <summary>The referrer of a young person: who they are, their role and the contact they verified (L2-071).</summary>
public sealed record EnrollmentReferral(string Name, string Role, string? Organization, string Contact);
