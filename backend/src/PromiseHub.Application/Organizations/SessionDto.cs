namespace PromiseHub.Application.Organizations;

public sealed record SessionDto(string PersonName, string Role, Guid OrganizationId, string OrganizationName, string Plan);
