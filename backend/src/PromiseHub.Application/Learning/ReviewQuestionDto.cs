namespace PromiseHub.Application.Learning;

/// <summary>
/// One question of a submitted attempt in review (L2-076 criterion 2): her answer, the correct options or accepted answers, and whether
/// she was right. Sent only when the quiz's feedback rule allows.
/// </summary>
public sealed record ReviewQuestionDto(
    Guid QuestionId,
    int Number,
    string Text,
    string Type,
    IReadOnlyList<string> Options,
    IReadOnlyList<int> Chosen,
    string? AnswerText,
    IReadOnlyList<int> CorrectOptions,
    IReadOnlyList<string> Accepted,
    bool Right);
