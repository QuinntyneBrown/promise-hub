namespace PromiseHub.Application.Slips;

/// <summary>One child's answer: Signed, Declined or Outstanding.</summary>
public sealed record SlipResponseDto(Guid ChildId, string Child, string Household, string Status, string? SignedBy);
