namespace PromiseHub.Application.Reports;

public sealed record TodayEventDto(Guid Id, string Name, DateTimeOffset StartsAt, string? Place, bool RequiresSlip);
