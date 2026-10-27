using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Curriculum;

/// <summary>
/// One question of a quiz at a position (L2-073, ADR 0054). Options and accepted answers are newline-separated; Correct holds the
/// zero-based indexes of the correct options, comma-separated.
/// </summary>
public sealed class QuizQuestion : ITenantOwned
{
    public const int MaximumText = 500;
    public const int MaximumOption = 200;
    public const int MinimumOptions = 2;
    public const int MaximumOptions = 6;
    public const int MaximumAnswers = 10;

    public QuizQuestion(Guid id, Guid organizationId, Guid quizId, int position, string text, QuestionType type, string? options, string? correct, string? answers)
    {
        Id = id;
        OrganizationId = organizationId;
        QuizId = quizId;
        Position = position;
        Text = text;
        Type = type;
        Options = options;
        Correct = correct;
        Answers = answers;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid QuizId { get; private set; }
    public int Position { get; private set; }
    public string Text { get; private set; }
    public QuestionType Type { get; private set; }
    public string? Options { get; private set; }
    public string? Correct { get; private set; }
    public string? Answers { get; private set; }

    public void Update(string text, QuestionType type, string? options, string? correct, string? answers)
    {
        Text = text;
        Type = type;
        Options = options;
        Correct = correct;
        Answers = answers;
    }

    public void MoveTo(int position) => Position = position;
}
