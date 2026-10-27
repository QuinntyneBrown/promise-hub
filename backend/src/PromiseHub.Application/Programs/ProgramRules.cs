namespace PromiseHub.Application.Programs;

public static class ProgramRules
{
    public const int NameLength = 120;
    public const int TermLength = 40;

    public static Dictionary<string, string> Check(SaveProgramCommand c)
    {
        var errors = new Dictionary<string, string>();
        if (string.IsNullOrWhiteSpace(c.Name))
        {
            errors["name"] = "Enter the program name.";
        }
        else if (c.Name.Trim().Length > NameLength)
        {
            errors["name"] = $"Keep the name under {NameLength} characters.";
        }
        if (c.StartsOn is null)
        {
            errors["startsOn"] = "Enter the start date.";
        }
        if (c.EndsOn is null)
        {
            errors["endsOn"] = "Enter the end date.";
        }
        else if (c.StartsOn is { } start && c.EndsOn < start)
        {
            errors["endsOn"] = "End after it starts.";
        }
        if (Clean(c.Term) is { Length: > TermLength })
        {
            errors["term"] = $"Keep the term under {TermLength} characters.";
        }
        if (c.Capacity < 1)
        {
            errors["capacity"] = "Enter a capacity of 1 or more.";
        }
        return errors;
    }

    public static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
