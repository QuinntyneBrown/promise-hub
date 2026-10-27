namespace PromiseHub.Application.Curriculum;

public sealed record CohortsCommand(IReadOnlyList<Guid>? ProgramIds);
