namespace PromiseHub.Application.Events;

/// <summary>A new or edited event. <see cref="RepeatsWeekly"/> applies only when creating (L2-093).</summary>
public sealed record SaveEventCommand(string Name, Guid ProgramId, DateTimeOffset? StartsAt, DateTimeOffset? EndsAt, string? Place, bool RequiresSlip, bool NoShowAlert, string? StaffNotes,
    bool RepeatsWeekly = false);
