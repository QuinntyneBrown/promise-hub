namespace PromiseHub.Application.Staff;

/// <summary>
/// An invitation link as the accept page reads it: open with what to show, or gone with the reason ("expired",
/// "withdrawn" or "used"; an unknown token reads as used) and, when known, the invitation for who to ask.
/// </summary>
public sealed record InvitationLookup(InvitationDto? Invitation, string? GoneReason)
{
    public bool Open => GoneReason is null;
}
