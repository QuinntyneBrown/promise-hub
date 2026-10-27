namespace PromiseHub.Application.Learning;

/// <summary>The Learning home (L2-068 criterion 1): progress across every track, the lesson to continue with, and the tracks.</summary>
public sealed record LearningHomeDto(int CompletedLessons, int TotalLessons, NextLessonDto? Next, IReadOnlyList<TrackSummaryDto> Tracks);
