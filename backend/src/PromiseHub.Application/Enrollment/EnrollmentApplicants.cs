using PromiseHub.Domain.Enrollment;

namespace PromiseHub.Application.Enrollment;

/// <summary>Reads who is applying from a draft: missing means a guardian; an unknown value is null.</summary>
public static class EnrollmentApplicants
{
    public static EnrollmentApplicant? Parse(string? value) =>
        string.IsNullOrWhiteSpace(value) ? EnrollmentApplicant.Guardian
        : Enum.TryParse<EnrollmentApplicant>(value.Trim(), ignoreCase: true, out var parsed) && Enum.IsDefined(parsed) ? parsed
        : null;
}
