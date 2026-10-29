namespace PromiseHub.Application.Reports;

/// <summary>The progress board of one cohort (L2-131): its track's published modules, a row per actively enrolled child and the cohort average.</summary>
public sealed record ProgressBoardDto(Guid ProgramId, string ProgramName, string? TrackName, IReadOnlyList<ProgressModuleDto> Modules,
    IReadOnlyList<ProgressRowDto> Youth, ProgressAverageDto Average);
