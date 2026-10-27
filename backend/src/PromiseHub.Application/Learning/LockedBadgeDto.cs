namespace PromiseHub.Application.Learning;

/// <summary>
/// A badge the youth can still earn (L2-087 criterion 4): what earns it and, for an automatic badge, how far she is (lessons done of the module for a
/// module badge, 0 or 1 of 1 otherwise); <see cref="Total"/> is null for a badge awarded by hand.
/// </summary>
public sealed record LockedBadgeDto(Guid Id, string Name, string Icon, string Description, string Kind, string? Rule, int? Completed, int? Total);
