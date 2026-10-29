namespace PromiseHub.Application.Reports;

/// <summary>The cohort average row: each module's average completion, the quiz average and overall of the youth with an account.</summary>
public sealed record ProgressAverageDto(IReadOnlyList<int?> Modules, int? QuizAverage, int? Overall);
