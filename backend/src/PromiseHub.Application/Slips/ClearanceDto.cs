namespace PromiseHub.Application.Slips;

public sealed record ClearanceDto(Guid SlipId, string Title, int Cleared, int Missing, int Declined, IReadOnlyList<ClearanceChildDto> Children);
