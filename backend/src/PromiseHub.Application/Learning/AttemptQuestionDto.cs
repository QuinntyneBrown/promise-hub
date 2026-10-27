namespace PromiseHub.Application.Learning;

/// <summary>A question as a youth takes it: its type and options, never its correct answers (L2-075 criterion 3).</summary>
public sealed record AttemptQuestionDto(Guid Id, string Text, string Type, IReadOnlyList<string> Options);
