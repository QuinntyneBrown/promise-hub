using System.Text.Json;

namespace PromiseHub.Application.Learning;

/// <summary>Reads and writes an attempt's answers, stored as a JSON list of <see cref="QuizAnswer"/> (ADR 0055).</summary>
public static class QuizAnswers
{
    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    public static IReadOnlyList<QuizAnswer> Read(string? stored)
    {
        if (string.IsNullOrWhiteSpace(stored) || stored == "{}")
        {
            return [];
        }
        return JsonSerializer.Deserialize<List<QuizAnswer>>(stored, Options) ?? [];
    }

    public static string Write(IEnumerable<QuizAnswer> answers) => JsonSerializer.Serialize(answers, Options);

    /// <summary>Whether an answer says anything: a choice or non-blank text.</summary>
    public static bool Given(QuizAnswer answer) => (answer.Choices?.Count ?? 0) > 0 || !string.IsNullOrWhiteSpace(answer.Text);
}
