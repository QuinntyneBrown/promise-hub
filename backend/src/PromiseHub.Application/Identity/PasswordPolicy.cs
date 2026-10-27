namespace PromiseHub.Application.Identity;

/// <summary>
/// The one password rule (L2-053), applied wherever a password is set: accepting an invitation and resetting. At least 12
/// and at most 128 characters, and not containing the part of the email before the @ when that has three characters or more.
/// </summary>
public static class PasswordPolicy
{
    public const int Minimum = 12;
    public const int Maximum = 128;

    /// <summary>The message for the password field, or null when the password meets the rule.</summary>
    public static string? Check(string? password, string email)
    {
        var value = password ?? string.Empty;
        if (value.Length < Minimum)
        {
            return $"Use at least {Minimum} characters.";
        }
        if (value.Length > Maximum)
        {
            return $"Use at most {Maximum} characters.";
        }
        var local = email.Split('@')[0];
        return local.Length >= 3 && value.Contains(local, StringComparison.OrdinalIgnoreCase)
            ? "Don’t use your email in your password."
            : null;
    }
}
