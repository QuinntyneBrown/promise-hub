namespace PromiseHub.Application.Organizations;

public sealed record ModuleDto(string Id, string Name, bool On, IReadOnlyList<string> Needs);
