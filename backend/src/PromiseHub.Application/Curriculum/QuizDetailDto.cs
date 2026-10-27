namespace PromiseHub.Application.Curriculum;

/// <summary>One quiz for the quiz builder (L2-073): its rules, ordered questions, the lessons it can be attached to and who will see it.</summary>
public sealed record QuizDetailDto(
    Guid Id,
    Guid ModuleId,
    string ModuleTitle,
    Guid TrackId,
    string TrackName,
    string Title,
    Guid? LessonId,
    string Status,
    int PassMark,
    int? AttemptsAllowed,
    string Feedback,
    bool Shuffle,
    bool RequiredToComplete,
    IReadOnlyList<QuizQuestionDto> Questions,
    IReadOnlyList<LessonOptionDto> Lessons,
    IReadOnlyList<string> Programs);
