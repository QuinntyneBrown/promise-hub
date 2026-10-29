namespace PromiseHub.Application.Organizations;

/// <summary>The stored logo to serve: a read-only stream and its content type.</summary>
public sealed record OrganizationLogoFile(Stream Content, string ContentType);
