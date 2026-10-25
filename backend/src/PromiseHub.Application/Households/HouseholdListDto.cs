namespace PromiseHub.Application.Households;

public sealed record HouseholdListDto(IReadOnlyList<HouseholdSummaryDto> Households, HouseholdCountsDto Counts);
