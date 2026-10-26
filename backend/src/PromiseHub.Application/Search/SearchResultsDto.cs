namespace PromiseHub.Application.Search;

/// <summary>Search results grouped by type. <see cref="Events"/> is null when Permission slips (which owns events) is off.</summary>
public sealed record SearchResultsDto(
    IReadOnlyList<ChildHitDto> Children,
    IReadOnlyList<HouseholdHitDto> Households,
    IReadOnlyList<EventHitDto>? Events);
