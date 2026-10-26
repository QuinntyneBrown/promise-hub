namespace PromiseHub.Application.Staff;

/// <summary>What the accept-invite page shows: who is invited, where, as what, and by whom.</summary>
public sealed record InvitationDto(string Email, string Organization, string Role, string InvitedBy);
