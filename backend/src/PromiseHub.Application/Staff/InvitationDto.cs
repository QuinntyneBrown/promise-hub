namespace PromiseHub.Application.Staff;

/// <summary>What the accept-invite page shows: who is invited, where, as what, by whom, and for a youth the child's name to offer.</summary>
public sealed record InvitationDto(string Email, string Organization, string Role, string InvitedBy, string? SuggestedName = null);
