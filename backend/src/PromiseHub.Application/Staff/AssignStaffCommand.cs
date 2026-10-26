namespace PromiseHub.Application.Staff;

/// <summary>Everyone who works the session; it replaces the session's assignments.</summary>
public sealed record AssignStaffCommand(Guid[]? MembershipIds);
