using PromiseHub.Domain.Curriculum;

namespace PromiseHub.Application.Curriculum;

/// <summary>A question that passed QuestionRules, ready to store: options and answers newline-separated, correct indexes comma-separated.</summary>
public sealed record CheckedQuestion(string Text, QuestionType Type, string? Options, string? Correct, string? Answers);
