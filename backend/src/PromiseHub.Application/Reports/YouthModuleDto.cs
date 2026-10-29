namespace PromiseHub.Application.Reports;

/// <summary>A published module as a youth stands with it: lessons done of total, and Done, InProgress or NotStarted.</summary>
public sealed record YouthModuleDto(Guid ModuleId, string Title, int Done, int Total, string State);
