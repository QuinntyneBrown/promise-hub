namespace PromiseHub.Application.Mentoring;

/// <summary>Assigning work (L2-092 criteria 2 and 3): the kind by name, the item, chosen youth or one cohort, the due date as yyyy-MM-dd, a message.</summary>
public sealed record AssignWorkRequest(string? Kind, Guid? ItemId, IReadOnlyList<Guid>? ChildIds, Guid? ProgramId, string? DueOn, string? Message);
