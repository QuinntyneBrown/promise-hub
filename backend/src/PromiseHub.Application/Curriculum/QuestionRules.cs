using PromiseHub.Domain.Curriculum;

namespace PromiseHub.Application.Curriculum;

/// <summary>
/// What each question type needs (L2-073 criterion 2): multiple choice 2 to 6 options and one correct, true / false the options True
/// and False and one correct, multiple answer 2 to 6 options and at least one correct, short answer 1 to 10 accepted answers.
/// </summary>
public static class QuestionRules
{
    private static readonly string[] TrueFalse = ["True", "False"];

    public static (CheckedQuestion? Question, Result? Invalid) Check(QuestionCommand command)
    {
        var errors = new Dictionary<string, string>();
        var text = CurriculumRules.Clean(command.Text);
        if (text is null)
        {
            errors["text"] = "Write the question.";
        }
        else if (text.Length > QuizQuestion.MaximumText)
        {
            errors["text"] = "Keep the question under 500 characters.";
        }
        if (!Enum.TryParse<QuestionType>(command.Type, out var type) || !Enum.IsDefined(type) || int.TryParse(command.Type, out _))
        {
            errors["type"] = "Choose a question type.";
            return (null, Result.Invalid(errors));
        }
        var options = type == QuestionType.TrueFalse ? [.. TrueFalse] : (command.Options ?? []).Select(o => o.Trim()).ToList();
        var correct = (command.Correct ?? []).Distinct().ToList();
        var answers = (command.Answers ?? []).Select(a => a.Trim()).Where(a => a.Length > 0).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        string? stored = null;
        string? storedCorrect = null;
        string? storedAnswers = null;
        if (type == QuestionType.ShortAnswer)
        {
            if (answers.Count == 0)
            {
                errors["answers"] = "Add at least one accepted answer.";
            }
            else if (answers.Count > QuizQuestion.MaximumAnswers || answers.Any(a => a.Length > QuizQuestion.MaximumOption))
            {
                errors["answers"] = "Keep it to 10 accepted answers of up to 200 characters.";
            }
            storedAnswers = string.Join('\n', answers);
        }
        else
        {
            if (options.Count is < QuizQuestion.MinimumOptions or > QuizQuestion.MaximumOptions || options.Any(o => o.Length == 0 || o.Length > QuizQuestion.MaximumOption))
            {
                errors["options"] = "Give 2 to 6 options.";
            }
            var inRange = correct.All(i => i >= 0 && i < options.Count);
            if (type == QuestionType.MultipleAnswer)
            {
                if (correct.Count == 0 || !inRange)
                {
                    errors["correct"] = "Mark at least one correct answer.";
                }
            }
            else if (correct.Count != 1 || !inRange)
            {
                errors["correct"] = "Mark the correct answer.";
            }
            stored = string.Join('\n', options);
            storedCorrect = string.Join(',', correct.Order());
        }
        return errors.Count > 0 ? (null, Result.Invalid(errors)) : (new CheckedQuestion(text!, type, stored, storedCorrect, storedAnswers), null);
    }

    public static IReadOnlyList<int> SplitIndexes(string? stored) =>
        string.IsNullOrEmpty(stored) ? [] : stored.Split(',').Select(int.Parse).ToList();
}
