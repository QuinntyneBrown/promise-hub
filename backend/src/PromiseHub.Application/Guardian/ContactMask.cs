namespace PromiseHub.Application.Guardian;

/// <summary>Contacts shown on the code page without giving them away: "•••-•••-0142", "c•••@example.com".</summary>
public static class ContactMask
{
    public static string Phone(string phone)
    {
        var digits = new string([.. phone.Where(char.IsDigit)]);
        return digits.Length >= 4 ? $"•••-•••-{digits[^4..]}" : "•••";
    }

    public static string Email(string email)
    {
        var at = email.IndexOf('@', StringComparison.Ordinal);
        return at > 0 ? $"{email[0]}•••{email[at..]}" : "•••";
    }

    public static string Digits(string value)
    {
        var digits = new string([.. value.Where(char.IsDigit)]);
        return digits.Length > 10 ? digits[^10..] : digits;
    }
}
