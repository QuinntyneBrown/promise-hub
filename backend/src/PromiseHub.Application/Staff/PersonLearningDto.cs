namespace PromiseHub.Application.Staff;

/// <summary>A youth's Learning progress on her record while Learning is on: lessons done of total and the badges she earned.</summary>
public sealed record PersonLearningDto(int LessonsDone, int LessonsTotal, IReadOnlyList<string> Badges);
