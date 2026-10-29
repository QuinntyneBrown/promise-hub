namespace PromiseHub.Application.Website;

/// <summary>The public website's profile (L2-005 criterion 7, L2-126, L2-132): the organization's name, city and website profile, for a visitor.</summary>
public sealed class PublicWebsiteHandler(PublicSiteResolver sites)
{
    public async Task<PublicSiteDto?> HandleAsync(string slug, CancellationToken cancellationToken = default) =>
        await sites.ResolveAsync(slug, cancellationToken) is { } organization
            ? new PublicSiteDto(organization.Name, organization.City, organization.WebsiteTagline, organization.WebsiteAbout, organization.WebsiteEmail)
            : null;
}
