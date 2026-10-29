namespace PromiseHub.Application.Organizations;

public sealed record SaveOrganizationProfileRequest(string? Name, string? City, string? ContactEmail, string? Phone, string? TimeZone);
