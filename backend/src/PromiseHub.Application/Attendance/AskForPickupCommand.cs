namespace PromiseHub.Application.Attendance;

/// <summary>Who has come to collect a child who is not on the approved list (dialog: confirm-pickup, state ask).</summary>
public sealed record AskForPickupCommand(Guid ChildId, string? CollectorName);
