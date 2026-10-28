namespace PromiseHub.Application.Learning;

/// <summary>
/// The Learning home (L2-068 criterion 1): progress across every track, the lesson to continue with, and the tracks; and, while Mentoring is
/// on, the work her mentors assigned her that she has not done, soonest due first (L2-092 criterion 5).
/// </summary>
public sealed record LearningHomeDto(int CompletedLessons, int TotalLessons, NextLessonDto? Next, IReadOnlyList<TrackSummaryDto> Tracks,
    IReadOnlyList<AssignedWorkItemDto> Assigned);
