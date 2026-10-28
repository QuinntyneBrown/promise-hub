namespace PromiseHub.Application.Learning;

/// <summary>
/// Work a mentor assigned the youth that she has not done yet (L2-092 criterion 5): the kind and item, its module, the due date as yyyy-MM-dd,
/// days left from the organization's today (negative once overdue), who assigned it and the message; a lesson's kind says where it opens.
/// </summary>
public sealed record AssignedWorkItemDto(string Kind, Guid ItemId, string? LessonKind, string Title, string ModuleTitle, string DueOn, int DaysLeft, string AssignedBy, string? Message);
