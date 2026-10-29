using System.Text.RegularExpressions;

namespace PromiseHub.Application.Organizations;

/// <summary>A plain check that a value looks like an email: something, an @, a domain with a dot, no spaces.</summary>
public static partial class EmailAddressRule
{
    public const string Message = "Enter an email like hello@example.org.";

    public static bool IsValid(string value) => value.Length <= 320 && Pattern().IsMatch(value);

    [GeneratedRegex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$")]
    private static partial Regex Pattern();
}
