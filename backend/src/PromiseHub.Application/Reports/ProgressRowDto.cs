namespace PromiseHub.Application.Reports;

/// <summary>
/// A row of the progress board: a cell per module (Done, InProgress, NotStarted or NoAccount), the average of best quiz scores and overall
/// completion, both null without a youth account.
/// </summary>
public sealed record ProgressRowDto(Guid ChildId, string Name, IReadOnlyList<string> Cells, int? QuizAverage, int? Overall);
