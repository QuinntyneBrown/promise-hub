namespace PromiseHub.Application.Guardian;

/// <summary>A guardian request's outcome, with the page data, the problem details, or the field errors.</summary>
public sealed record GuardianResult(GuardianOutcome Outcome, object? Value = null, IReadOnlyDictionary<string, string>? Errors = null)
{
    public static GuardianResult Of(GuardianOutcome outcome, object? value = null) => new(outcome, value);

    public static GuardianResult Invalid(string field, string message) => new(GuardianOutcome.Invalid, Errors: new Dictionary<string, string> { [field] = message });
}
