namespace PromiseHub.Application.Organizations;

/// <summary>The organization's profile on Settings › Organization (`settings-organization`, L2-122) and whether a logo is set (L2-123).</summary>
public sealed record OrganizationProfileDto(string Name, string City, string? ContactEmail, string? Phone, string TimeZone, bool HasLogo);
