using PromiseHub.Domain.Imports;

namespace PromiseHub.Application.Imports;

/// <summary>Proposes a field for each column from its header; a column it cannot place is left for the admin to map.</summary>
public static class ColumnMatcher
{
    private static readonly (ImportField Field, string[] Names)[] Synonyms =
    [
        (ImportField.ChildName, ["child", "child name", "student", "student name", "kid", "name", "participant"]),
        (ImportField.DateOfBirth, ["dob", "date of birth", "birthday", "birth date", "birthdate"]),
        (ImportField.School, ["school", "grade", "school and grade"]),
        (ImportField.GuardianName, ["parent", "guardian", "parent name", "guardian name", "parent/guardian", "mother", "father", "contact name"]),
        (ImportField.GuardianPhone, ["cell", "phone", "mobile", "parent phone", "guardian phone", "cell phone", "phone number"]),
        (ImportField.GuardianEmail, ["email", "e-mail", "parent email", "guardian email"]),
        (ImportField.Allergies, ["allergies", "allergy", "medical", "allergies/meds", "allergies and medication"]),
        (ImportField.Language, ["lang", "language", "home language"]),
        (ImportField.Notes, ["notes", "note", "comments"]),
        (ImportField.Cohort, ["cohort", "group", "program", "class"]),
        (ImportField.YouthEmail, ["youth email", "student email", "teen email"]),
    ];

    public static ImportField? Match(string header)
    {
        var key = header.Trim().ToLowerInvariant();
        foreach (var (field, names) in Synonyms)
        {
            if (names.Contains(key))
            {
                return field;
            }
        }
        return null;
    }
}
