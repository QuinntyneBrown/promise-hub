using PromiseHub.Domain.Enrollment;

namespace PromiseHub.Application.Enrollment;

/// <summary>
/// What a draft needs before it is saved (L2-013 criterion 6, L2-071 criteria 2 to 4 and 11): a guardian's household and
/// children; or, for a young person or a referral, the one young person with a reason and their guardian's contact, and the
/// referrer's name and role. A young person applying for themselves is 12 to 18 on the day.
/// </summary>
public static class EnrollmentDraftRules
{
    public const int MinimumYouthAge = 12;
    public const int MaximumYouthAge = 18;

    public static int Age(DateOnly dateOfBirth, DateOnly today)
    {
        var age = today.Year - dateOfBirth.Year;
        return dateOfBirth.AddYears(age) > today ? age - 1 : age;
    }

    public static Dictionary<string, string> Validate(EnrollmentDraft draft, DateOnly today)
    {
        var errors = new Dictionary<string, string>();
        var applying = EnrollmentApplicants.Parse(draft.ApplyingAs);
        if (applying is null)
        {
            errors["applyingAs"] = "Choose who is applying.";
            return errors;
        }
        if (applying == EnrollmentApplicant.Guardian)
        {
            ValidateGuardian(draft, errors);
        }
        else
        {
            ValidateApplicant(draft, applying.Value, today, errors);
        }
        return errors;
    }

    private static void ValidateGuardian(EnrollmentDraft draft, Dictionary<string, string> errors)
    {
        if (string.IsNullOrWhiteSpace(draft.Household?.GuardianName))
        {
            errors["guardianName"] = "Enter your full name.";
        }
        Contact(draft, errors);
        var children = draft.Children ?? [];
        if (!children.Any(c => c.Enroll))
        {
            errors["children"] = "Add at least one child.";
        }
        for (var i = 0; i < children.Count; i++)
        {
            var c = children[i];
            if (!c.Enroll)
            {
                continue;
            }
            if (string.IsNullOrWhiteSpace(c.FirstName) || string.IsNullOrWhiteSpace(c.LastName))
            {
                errors[$"children[{i}].name"] = "Enter the child’s first and last name.";
            }
            if (c.DateOfBirth is null)
            {
                errors[$"children[{i}].dateOfBirth"] = "Enter the child’s date of birth.";
            }
        }
    }

    private static void ValidateApplicant(EnrollmentDraft draft, EnrollmentApplicant applying, DateOnly today, Dictionary<string, string> errors)
    {
        var youth = applying == EnrollmentApplicant.Youth;
        if (string.IsNullOrWhiteSpace(draft.Household?.GuardianName))
        {
            errors["guardianName"] = youth ? "Enter your parent or guardian’s name." : "Enter their parent or guardian’s name.";
        }
        Contact(draft, errors);
        var children = draft.Children ?? [];
        if (children.Count(c => c.Enroll) > 1)
        {
            errors["children"] = "Apply for one young person at a time.";
        }
        var person = children.FirstOrDefault(c => c.Enroll);
        if (string.IsNullOrWhiteSpace(person?.FirstName) || string.IsNullOrWhiteSpace(person?.LastName))
        {
            errors["children[0].name"] = "Enter the young person’s first and last name.";
        }
        if (person?.DateOfBirth is not { } dateOfBirth)
        {
            errors["children[0].dateOfBirth"] = "Enter the young person’s date of birth.";
        }
        else if (youth && Age(dateOfBirth, today) is < MinimumYouthAge or > MaximumYouthAge)
        {
            errors["children[0].dateOfBirth"] = "Young people aged 12 to 18 can apply for themselves. Ask a parent or guardian to apply for you.";
        }
        if (string.IsNullOrWhiteSpace(draft.Reason))
        {
            errors["reason"] = youth ? "Tell us why you’re interested." : "Tell us why you’re referring them.";
        }
    }

    private static void Contact(EnrollmentDraft draft, Dictionary<string, string> errors)
    {
        if (string.IsNullOrWhiteSpace(draft.Household?.Mobile) && string.IsNullOrWhiteSpace(draft.Household?.Email))
        {
            errors["mobile"] = "Add a mobile number or an email.";
        }
    }
}
