namespace PromiseHub.Application.Learning;

/// <summary>A badge the youth holds, with when and, for one awarded by hand, who awarded it (L2-087 criterion 4).</summary>
public sealed record EarnedBadgeDto(Guid Id, string Name, string Icon, string Description, DateTimeOffset AwardedAt, string? AwardedBy);
