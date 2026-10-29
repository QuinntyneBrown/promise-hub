namespace PromiseHub.Application.Website;

/// <summary>The outcome of a public website request, with the field errors when invalid or the answer when there is one.</summary>
public sealed record WebsiteResult(WebsiteOutcome Outcome, IReadOnlyDictionary<string, string>? Errors = null, object? Value = null)
{
    public static readonly WebsiteResult Done = new(WebsiteOutcome.Done);
    public static readonly WebsiteResult NotFound = new(WebsiteOutcome.NotFound);
    public static readonly WebsiteResult TooMany = new(WebsiteOutcome.TooMany);
    public static readonly WebsiteResult Unavailable = new(WebsiteOutcome.Unavailable);

    public static WebsiteResult Invalid(IReadOnlyDictionary<string, string> errors) => new(WebsiteOutcome.Invalid, errors);

    public static WebsiteResult Ok(object value) => new(WebsiteOutcome.Ok, Value: value);
}
