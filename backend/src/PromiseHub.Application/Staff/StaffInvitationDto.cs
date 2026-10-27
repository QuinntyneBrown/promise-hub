namespace PromiseHub.Application.Staff;

/// <summary>An invitation on Staff and roles (L2-052): Pending or Expired, the child for a youth, and whether the invitee asked for a new link.</summary>
public sealed record StaffInvitationDto(Guid Id, string Email, string Role, string InvitedBy, DateTimeOffset InvitedAt, DateTimeOffset ExpiresAt,
    string Status, string? ChildName, bool ReplacementRequested);
