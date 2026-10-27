namespace PromiseHub.Application.Curriculum;

/// <summary>The organization's badges with how many awards there are and how many youth hold one.</summary>
public sealed record BadgeListDto(IReadOnlyList<BadgeSummaryDto> Badges, int Awards, int Youth);
