namespace PromiseHub.Application.Reports;

/// <summary>A youth's lessons done of every published lesson of the tracks she follows, the average of her best quiz scores, each module, each attempted quiz and her badges.</summary>
public sealed record YouthLearningDto(
    int CompletedLessons,
    int TotalLessons,
    int? Completion,
    int? QuizAverage,
    IReadOnlyList<YouthModuleDto> Modules,
    IReadOnlyList<YouthQuizDto> Quizzes,
    IReadOnlyList<string> Badges);
