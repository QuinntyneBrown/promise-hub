namespace PromiseHub.Application.Curriculum;

/// <summary>A live lesson of the module a quiz or assignment can be attached to, in order.</summary>
public sealed record LessonOptionDto(Guid Id, int Position, string Title);
