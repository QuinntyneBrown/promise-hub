using PromiseHub.Application.Guardian;

namespace PromiseHub.Application.Enrollment;

/// <summary>A typed contact as PromiseHub keeps it: ten phone digits, or a lower-case email; null when it is neither.</summary>
public static class EnrollmentContact
{
    public static string? Normalize(string? typed)
    {
        var value = typed?.Trim() ?? string.Empty;
        if (value.Contains('@', StringComparison.Ordinal))
        {
            return value.Length > 3 ? value.ToLowerInvariant() : null;
        }
        var digits = ContactMask.Digits(value);
        return digits.Length == 10 ? digits : null;
    }

    public static bool IsPhone(string contact) => !contact.Contains('@', StringComparison.Ordinal);

    /// <summary>"905-555-0300" for ten digits.</summary>
    public static string Display(string contact) => IsPhone(contact) ? $"{contact[..3]}-{contact[3..6]}-{contact[6..]}" : contact;
}
