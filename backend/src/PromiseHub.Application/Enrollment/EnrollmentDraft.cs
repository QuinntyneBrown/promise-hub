namespace PromiseHub.Application.Enrollment;

/// <summary>What the guardian has entered so far: the household and the children to enroll.</summary>
public sealed record EnrollmentDraft(EnrollmentHouseholdDraft Household, IReadOnlyList<EnrollmentChildDraft> Children);
