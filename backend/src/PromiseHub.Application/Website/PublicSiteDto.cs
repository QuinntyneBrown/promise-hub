namespace PromiseHub.Application.Website;

/// <summary>What an anonymous visitor may read about an organization: published facts only, with its website profile (L2-126).</summary>
public sealed record PublicSiteDto(string Name, string City, string? Tagline, string? About, string? Email);
