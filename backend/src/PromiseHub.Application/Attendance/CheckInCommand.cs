namespace PromiseHub.Application.Attendance;

public sealed record CheckInCommand(Guid ChildId, DateTimeOffset? ArrivedAt, Guid ClientActionId);
