namespace PromiseHub.Application.Learning;

/// <summary>
/// A youth's own progress (L2-088): lessons done of every published lesson of her followed tracks, her streak, her quiz average (null with no scored
/// quiz), her quiz history, her competencies, and her attendance, null while Roll Call is off.
/// </summary>
public sealed record ProgressViewDto(int CompletedLessons, int TotalLessons, int StreakWeeks, int? QuizAverage, IReadOnlyList<QuizHistoryDto> Quizzes,
    IReadOnlyList<CompetencyLevelDto> Competencies, AttendanceSummaryDto? Attendance);
