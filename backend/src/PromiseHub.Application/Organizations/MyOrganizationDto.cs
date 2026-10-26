namespace PromiseHub.Application.Organizations;

public sealed record MyOrganizationDto(Guid MembershipId, string Name, string Role, bool Active);
