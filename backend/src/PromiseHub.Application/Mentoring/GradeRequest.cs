namespace PromiseHub.Application.Mentoring;

/// <summary>A grade (L2-080 criteria 3 to 5): <see cref="Decision"/> is draft, approve or revise; <see cref="Version"/> is the one it was read at (L2-083).</summary>
public sealed record GradeRequest(string? Decision, IReadOnlyList<GradeScore>? Scores, string? Comment, int Version);
