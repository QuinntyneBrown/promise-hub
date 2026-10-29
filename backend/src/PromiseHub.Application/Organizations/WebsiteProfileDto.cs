namespace PromiseHub.Application.Organizations;

/// <summary>Public website's defaults on Settings › Organization (L2-126): the address after /site/, the tagline, about and public email.</summary>
public sealed record WebsiteProfileDto(string? Slug, string? Tagline, string? About, string? ContactEmail);
