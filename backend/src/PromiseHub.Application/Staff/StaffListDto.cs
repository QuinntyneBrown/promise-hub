namespace PromiseHub.Application.Staff;

/// <summary>The organization's staff with access, and invitations not yet accepted (page: staff).</summary>
public sealed record StaffListDto(IReadOnlyList<StaffMemberDto> Members, IReadOnlyList<StaffInvitationDto> Invitations);
