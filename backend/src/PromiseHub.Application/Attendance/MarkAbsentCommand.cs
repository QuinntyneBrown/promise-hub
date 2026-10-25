namespace PromiseHub.Application.Attendance;

public sealed record MarkAbsentCommand(Guid ChildId, Guid ClientActionId);
