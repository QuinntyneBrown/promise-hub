using System.Text.RegularExpressions;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// The invitation's sender name (L2-139 criterion 3): 1 to 30 letters, numbers, spaces and <c>&amp;'.-</c>, and never a link or a phone
/// number, since it starts every text and signs every email.
/// </summary>
public static partial class SenderNameRule
{
    public const int Maximum = 30;
    public const string Message = "Use 1 to 30 letters, numbers and spaces.";

    public static bool IsValid(string value) =>
        value.Length is > 0 and <= Maximum && value.Trim().Length > 0 && Allowed().IsMatch(value) && !Link().IsMatch(value)
        && value.Count(char.IsAsciiDigit) < 7;

    /// <summary>The organization's name, cut to 30 characters at a word boundary, used until a sender name is saved (criterion 5).</summary>
    public static string Default(string organization)
    {
        if (organization.Length <= Maximum)
        {
            return organization;
        }
        var cut = organization[..Maximum];
        var space = cut.LastIndexOf(' ');
        return (space > 0 ? cut[..space] : cut).TrimEnd();
    }

    [GeneratedRegex(@"^[\p{L}\p{N} &'’.\-]+$")]
    private static partial Regex Allowed();

    // A word, a dot and a domain ending, such as "harbourview.ca" or "hbv.ph".
    [GeneratedRegex(@"[\p{L}\p{N}-]\.[\p{L}]{2,}", RegexOptions.IgnoreCase)]
    private static partial Regex Link();
}
