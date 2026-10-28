namespace PromiseHub.Application.Attendance;

/// <summary>Marks a child absent; <paramref name="Excused"/> marks an absence the organization accepts (L2-095).</summary>
public sealed record MarkAbsentCommand(Guid ChildId, Guid ClientActionId, bool Excused = false);
