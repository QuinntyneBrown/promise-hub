namespace PromiseHub.Application.Curriculum;

public sealed record QuestionOrderCommand(IReadOnlyList<Guid>? QuestionIds);
