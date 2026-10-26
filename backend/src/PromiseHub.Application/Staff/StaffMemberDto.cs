namespace PromiseHub.Application.Staff;

public sealed record StaffMemberDto(Guid Id, string Name, string Email, string Role, bool IsYou);
