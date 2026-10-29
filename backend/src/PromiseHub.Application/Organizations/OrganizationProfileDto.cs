namespace PromiseHub.Application.Organizations;

/// <summary>
/// The organization's profile on Settings › Organization (`settings-organization`, L2-122), whether a logo is set and, when it is, its file
/// name, when and by whom (L2-123).
/// </summary>
public sealed record OrganizationProfileDto(string Name, string City, string? ContactEmail, string? Phone, string TimeZone, bool HasLogo, OrganizationLogoDto? Logo);
