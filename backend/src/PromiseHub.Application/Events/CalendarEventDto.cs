namespace PromiseHub.Application.Events;

/// <summary>An event on the calendar, with the organization's calendar day of its start (L2-093 criterion 3).</summary>
public sealed record CalendarEventDto(Guid Id, string Name, Guid ProgramId, string ProgramName, DateOnly Day, DateTimeOffset StartsAt, DateTimeOffset EndsAt, string? Place, string Status);
