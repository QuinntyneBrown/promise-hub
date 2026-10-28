namespace PromiseHub.Application.Events;

public sealed record YouthScheduleDto(IReadOnlyList<ScheduleSessionDto> Sessions);
