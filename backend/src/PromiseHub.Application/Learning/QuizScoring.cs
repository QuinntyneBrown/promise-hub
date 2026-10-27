using PromiseHub.Domain.Curriculum;

namespace PromiseHub.Application.Learning;

/// <summary>
/// Whether an answer is right, on the server against the stored answers (L2-075 criterion 5, ADR 0055): a multiple choice or true / false
/// is its correct option, a multiple answer exactly its correct options, a short answer one of the accepted answers ignoring capitals and
/// surrounding spaces; a blank answer is wrong.
/// </summary>
public static class QuizScoring
{
    public static bool IsRight(QuizQuestion question, QuizAnswer? answer)
    {
        if (answer is null)
        {
            return false;
        }
        if (question.Type == QuestionType.ShortAnswer)
        {
            var given = answer.Text?.Trim();
            return !string.IsNullOrEmpty(given) && Accepted(question).Any(a => string.Equals(a.Trim(), given, StringComparison.OrdinalIgnoreCase));
        }
        var correct = CorrectOptions(question);
        return correct.Count > 0 && (answer.Choices ?? []).Distinct().Order().SequenceEqual(correct);
    }

    public static IReadOnlyList<int> CorrectOptions(QuizQuestion question) =>
        string.IsNullOrEmpty(question.Correct) ? [] : question.Correct.Split(',').Select(int.Parse).Order().ToList();

    public static IReadOnlyList<string> Accepted(QuizQuestion question) =>
        string.IsNullOrEmpty(question.Answers) ? [] : question.Answers.Split('\n');
}
