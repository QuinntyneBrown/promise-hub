using System.Text;
using System.Text.RegularExpressions;
using PromiseHub.Domain.Curriculum;

namespace PromiseHub.Application.Curriculum;

/// <summary>Lengths, keys and messages shared by the curriculum commands (L2-066, L2-067).</summary>
public static partial class CurriculumRules
{
    public static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    /// <summary>"Digital Skills" → "digital-skills": lowercase letters and numbers joined by single hyphens.</summary>
    public static string KeyFrom(string name)
    {
        var builder = new StringBuilder();
        foreach (var c in name.Normalize(NormalizationForm.FormD).ToLowerInvariant())
        {
            if (c is >= 'a' and <= 'z' or >= '0' and <= '9')
            {
                builder.Append(c);
            }
            else if (char.IsWhiteSpace(c) || c is '-' or '_')
            {
                builder.Append('-');
            }
        }
        var key = MultipleHyphens().Replace(builder.ToString(), "-").Trim('-');
        return key.Length > Track.MaximumKey ? key[..Track.MaximumKey].Trim('-') : key;
    }

    public static bool IsKey(string key) => key.Length <= Track.MaximumKey && KeyPattern().IsMatch(key);

    /// <summary>The same ids as the current set, each once.</summary>
    public static bool IsSameSet(IReadOnlyList<Guid>? sent, IReadOnlyCollection<Guid> current) =>
        sent is not null && sent.Count == current.Count && sent.Distinct().Count() == sent.Count && sent.All(current.Contains);

    public static Result Invalid(string field, string message) => Result.Invalid(new Dictionary<string, string> { [field] = message });

    [GeneratedRegex("^[a-z0-9]+(-[a-z0-9]+)*$")]
    private static partial Regex KeyPattern();

    [GeneratedRegex("-{2,}")]
    private static partial Regex MultipleHyphens();
}
