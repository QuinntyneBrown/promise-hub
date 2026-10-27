namespace PromiseHub.Application.Curriculum;

public sealed record ModuleOrderCommand(IReadOnlyList<Guid>? ModuleIds);
