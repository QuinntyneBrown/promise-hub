namespace PromiseHub.Application.Reports;

/// <summary>Work waiting for the caller: <c>incidents</c>, <c>enrollments</c> or <c>pickups</c>, with how many.</summary>
public sealed record TodayTaskDto(string Kind, int Count);
