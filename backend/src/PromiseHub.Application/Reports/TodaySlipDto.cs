namespace PromiseHub.Application.Reports;

public sealed record TodaySlipDto(Guid EventId, string Title, DateOnly SignBy, int Signed, int Expected, int Unsigned);
