namespace PromiseHub.Domain.LearningBond;

/// <summary>Checks a SIN's form before it is encrypted (L2-159 criterion 8): nine digits, spaces and hyphens allowed, and a valid check digit.</summary>
public static class SocialInsuranceNumber
{
    /// <summary>The nine digits, or null when the value is not a valid SIN.</summary>
    public static string? Normalize(string? value)
    {
        if (value is null)
        {
            return null;
        }
        var digits = new string([.. value.Where(c => c is not (' ' or '-'))]);
        if (digits.Length != 9 || !digits.All(char.IsAsciiDigit) || !HasValidCheckDigit(digits))
        {
            return null;
        }
        return digits;
    }

    // The Luhn check the Government of Canada uses for SINs.
    private static bool HasValidCheckDigit(string digits)
    {
        var sum = 0;
        for (var i = 0; i < digits.Length; i++)
        {
            var d = digits[i] - '0';
            if (i % 2 == 1)
            {
                d *= 2;
                if (d > 9)
                {
                    d -= 9;
                }
            }
            sum += d;
        }
        return sum % 10 == 0;
    }
}
