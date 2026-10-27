namespace PromiseHub.Application.Curriculum;

/// <summary>One question for the quiz builder, with its correct answers: authors only (L2-073 criterion 7).</summary>
public sealed record QuizQuestionDto(Guid Id, int Position, string Text, string Type, IReadOnlyList<string> Options, IReadOnlyList<int> Correct, IReadOnlyList<string> Answers);
