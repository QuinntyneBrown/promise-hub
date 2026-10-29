using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Website;

namespace PromiseHub.Application.Website;

/// <summary>Server-side checks of the public forms (L2-134, L2-031): trimmed, length-limited plain text from the fixed lists.</summary>
public static class WebsiteRules
{
    public const string EmailMessage = "Enter an email like name@example.com.";

    /// <summary>Trims a value; empty becomes null.</summary>
    public static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    public static void Name(string? name, Dictionary<string, string> errors, string field = "name")
    {
        if (name is null || name.Length > ContactMessage.MaximumName)
        {
            errors[field] = "Enter your name.";
        }
    }

    public static void Email(string? email, Dictionary<string, string> errors)
    {
        if (email is null || email.Length > ContactMessage.MaximumEmail || !EmailAddressRule.IsValid(email))
        {
            errors["email"] = EmailMessage;
        }
    }
}
