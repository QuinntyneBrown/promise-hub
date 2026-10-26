namespace PromiseHub.Application.Organizations;

/// <summary>Every organization the signed-in person belongs to, the active one marked (L2-002).</summary>
public sealed record MyOrganizationsDto(IReadOnlyList<MyOrganizationDto> Organizations);
