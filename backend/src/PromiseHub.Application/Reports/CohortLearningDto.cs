namespace PromiseHub.Application.Reports;

/// <summary>Learning in a cohort: the average completion of active youth with an account and each published module of the track (L2-127 criterion 2).</summary>
public sealed record CohortLearningDto(int? AverageCompletion, IReadOnlyList<ModuleCompletionDto> Modules);
