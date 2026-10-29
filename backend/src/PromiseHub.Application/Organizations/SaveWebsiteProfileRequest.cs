namespace PromiseHub.Application.Organizations;

public sealed record SaveWebsiteProfileRequest(string? Slug, string? Tagline, string? About, string? ContactEmail);
