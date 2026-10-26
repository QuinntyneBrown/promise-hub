namespace PromiseHub.Application.Staff;

public sealed record StaffInvitationDto(Guid Id, string Email, string Role, string InvitedBy, DateTimeOffset InvitedAt, DateTimeOffset ExpiresAt);
