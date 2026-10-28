namespace PromiseHub.Application.Mentoring;

/// <summary>Work assigned (L2-092 criterion 2): how many youth it went to, the item's title and the due date as yyyy-MM-dd.</summary>
public sealed record AssignedWorkResultDto(int Count, string Title, string DueOn);
