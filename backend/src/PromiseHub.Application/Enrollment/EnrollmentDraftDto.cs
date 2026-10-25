namespace PromiseHub.Application.Enrollment;

public sealed record EnrollmentDraftDto(bool Returning, string Language, string Program, EnrollmentHouseholdDraft Household, IReadOnlyList<EnrollmentChildDraft> Children);
