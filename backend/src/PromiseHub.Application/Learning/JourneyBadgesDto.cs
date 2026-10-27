namespace PromiseHub.Application.Learning;

/// <summary>The journey's badge strip (L2-087 criteria 1 and 6): earned of the badges she can earn, earned first.</summary>
public sealed record JourneyBadgesDto(int Earned, int Total, IReadOnlyList<JourneyBadgeDto> Items);
