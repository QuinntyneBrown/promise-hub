namespace PromiseHub.Application.Reports;

/// <summary>A column of the progress board: a published module of the track, in order.</summary>
public sealed record ProgressModuleDto(Guid ModuleId, string Title);
