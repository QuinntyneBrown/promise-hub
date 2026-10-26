namespace PromiseHub.Application.Staff;

/// <summary>An acceptance: gone (with the reason), invalid with messages, or the account and membership to sign in as.</summary>
public sealed record AcceptInvitationResult(bool Gone, IReadOnlyDictionary<string, string>? Errors, Guid? UserId, Guid? MembershipId, InvitationDto? Invitation = null,
    string? GoneReason = null);
