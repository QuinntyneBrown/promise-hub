namespace PromiseHub.Application.Learning;

/// <summary>One medal on the journey's badge strip.</summary>
public sealed record JourneyBadgeDto(Guid Id, string Name, string Icon, bool Earned);
