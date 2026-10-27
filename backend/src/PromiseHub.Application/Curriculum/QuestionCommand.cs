namespace PromiseHub.Application.Curriculum;

/// <summary>A quiz question as the author wrote it: options and correct option indexes for choice types, accepted answers for short answer.</summary>
public sealed record QuestionCommand(string? Text, string? Type, IReadOnlyList<string>? Options, IReadOnlyList<int>? Correct, IReadOnlyList<string>? Answers);
