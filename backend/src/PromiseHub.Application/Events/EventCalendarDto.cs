namespace PromiseHub.Application.Events;

/// <summary>A month of events (yyyy-MM), the organization's today and the events that start in the month, soonest first.</summary>
public sealed record EventCalendarDto(string Month, DateOnly Today, IReadOnlyList<CalendarEventDto> Events);
