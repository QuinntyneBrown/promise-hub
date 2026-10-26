namespace PromiseHub.Application.Organizations;

public sealed record AddOrganizationCommand(string? Name, string? AdminEmail, string? Plan, string? Preset);
