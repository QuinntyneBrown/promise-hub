namespace PromiseHub.Application.Curriculum;

public sealed record SaveLessonCommand(
    string? Title,
    string? Reading,
    int? Minutes,
    IReadOnlyList<string>? Objectives,
    string? Body,
    IReadOnlyList<string>? Prompts,
    string? LeaderNotes);
