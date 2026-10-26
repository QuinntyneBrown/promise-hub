namespace PromiseHub.Application.Reports;

/// <summary>The director's Today: roster counts, slips due (null when Slips is off), what's coming up and the tasks waiting.</summary>
public sealed record TodayDto(
    int ActiveChildren,
    int Households,
    IReadOnlyList<TodaySlipDto>? SlipsDue,
    IReadOnlyList<TodayEventDto> ComingUp,
    IReadOnlyList<TodayTaskDto> Tasks);
