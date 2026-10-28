namespace PromiseHub.Application.Attendance;

/// <summary>Checks a child in now or earlier; <paramref name="Late"/> marks a check-in after the start (L2-095).</summary>
public sealed record CheckInCommand(Guid ChildId, DateTimeOffset? ArrivedAt, Guid ClientActionId, bool Late = false);
