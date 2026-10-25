namespace PromiseHub.Application.Events;

public sealed record SaveEventCommand(string Name, Guid ProgramId, DateTimeOffset? StartsAt, DateTimeOffset? EndsAt, string? Place, bool RequiresSlip, bool NoShowAlert, string? StaffNotes);
