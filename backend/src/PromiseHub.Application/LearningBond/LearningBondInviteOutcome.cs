namespace PromiseHub.Application.LearningBond;

/// <summary>An invitation at the door: created now, already sent within 7 days (with when), forbidden or not found (L2-140 criteria 4 and 5).</summary>
public sealed record LearningBondInviteOutcome(ResultStatus Status, DateTimeOffset? InvitedAt = null);
