namespace PromiseHub.Application.Curriculum;

/// <summary>A lesson, module, quiz, assignment or competency a badge can name, with the title the builder shows.</summary>
public sealed record BadgeTargetDto(Guid Id, string Title);
