namespace PromiseHub.Application.Events;

public sealed record EventListDto(IReadOnlyList<EventSummaryDto> Events, int Upcoming, int NeedSlips);
