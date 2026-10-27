namespace PromiseHub.Application.Learning;

/// <summary>A youth's badges (L2-087 criteria 4 and 5): earned oldest first, those she can still earn in the order they were made, and her milestones.</summary>
public sealed record LearnerBadgesDto(IReadOnlyList<EarnedBadgeDto> Earned, IReadOnlyList<LockedBadgeDto> Locked, IReadOnlyList<MilestoneDto> Milestones);
