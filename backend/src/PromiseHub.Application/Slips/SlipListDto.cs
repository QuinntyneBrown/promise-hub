namespace PromiseHub.Application.Slips;

public sealed record SlipListDto(IReadOnlyList<SlipRowDto> Slips);
