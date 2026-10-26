namespace PromiseHub.Application.Organizations;

/// <summary>One row of the platform admin's organizations list (L2-003).</summary>
public sealed record PlatformOrganizationDto(Guid Id, string Name, string Plan, int ActiveChildren, int ModulesOn, string Status, string? SuspensionReason);
