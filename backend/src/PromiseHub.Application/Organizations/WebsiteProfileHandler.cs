using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Domain.Audit;

namespace PromiseHub.Application.Organizations;

/// <summary>
/// The public website profile (L2-126, ADR 0073): the address, tagline, about and public email of the signed-in membership's organization.
/// The address is unique across organizations; one already used answers 422 without saying whose it is. Saving is audited.
/// </summary>
public sealed partial class WebsiteProfileHandler(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit)
{
    public const int TaglineMaximum = 120;
    public const int AboutMaximum = 1000;

    public async Task<WebsiteProfileDto> GetAsync(CancellationToken cancellationToken = default)
    {
        var o = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        return new WebsiteProfileDto(o.WebsiteSlug, o.WebsiteTagline, o.WebsiteAbout, o.WebsiteEmail);
    }

    public async Task<Result> SaveAsync(SaveWebsiteProfileRequest request, CancellationToken cancellationToken = default)
    {
        var slug = request.Slug?.Trim() ?? string.Empty;
        var tagline = request.Tagline?.Trim() ?? string.Empty;
        var about = string.IsNullOrWhiteSpace(request.About) ? null : request.About.Trim();
        var email = string.IsNullOrWhiteSpace(request.ContactEmail) ? null : request.ContactEmail.Trim().ToLowerInvariant();
        var errors = new Dictionary<string, string>();
        if (!Slug().IsMatch(slug))
        {
            errors["slug"] = "Use 3 to 40 lowercase letters, numbers and hyphens, starting with a letter.";
        }
        else if (await db.Organizations.AsNoTracking().AnyAsync(o => o.WebsiteSlug == slug && o.Id != tenant.OrganizationId, cancellationToken))
        {
            errors["slug"] = "Another organization uses this address. Choose another.";
        }
        if (tagline.Length is 0 or > TaglineMaximum)
        {
            errors["tagline"] = "Write a tagline of up to 120 characters.";
        }
        if (about?.Length > AboutMaximum)
        {
            errors["about"] = "Use at most 1,000 characters.";
        }
        if (email is not null && !EmailAddressRule.IsValid(email))
        {
            errors["contactEmail"] = EmailAddressRule.Message;
        }
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }
        var organization = await db.Organizations.SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        var before = organization.WebsiteSlug;
        organization.ChangeWebsiteProfile(slug, tagline, about, email);
        audit.Record(new AuditEvent(AuditAction.Updated, "Organization", organization.Id, $"Website profile at /site/{slug} saved by {tenant.ActorName}",
            new { Address = before }, new { Address = slug }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    [GeneratedRegex("^[a-z][a-z0-9-]{2,39}$")]
    private static partial Regex Slug();
}
