namespace PromiseHub.Application.Learning;

/// <summary>The youth's lessons; empty until a track is published (prompt 57).</summary>
public sealed record LessonsDto(IReadOnlyList<string> Lessons);
