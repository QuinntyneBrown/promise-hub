using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Domain.Audit;

namespace PromiseHub.Application.Organizations;

/// <summary>
/// The organization's profile (L2-122, ADR 0073): the name, city, contact email, phone and time zone of the signed-in membership's
/// organization only. Each field is checked; a save is audited as Updated on Organization with the names of the fields that changed.
/// </summary>
public sealed class OrganizationProfileHandler(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit)
{
    public const int Maximum = 100;

    public async Task<OrganizationProfileDto> GetAsync(CancellationToken cancellationToken = default)
    {
        var o = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        var logo = o.LogoKey is null ? null : new OrganizationLogoDto(o.LogoFileName!, o.LogoUploadedAt!.Value, o.LogoUploadedBy!);
        return new OrganizationProfileDto(o.Name, o.City, o.ContactEmail, o.Phone, o.TimeZone, logo is not null, logo);
    }

    public async Task<Result> SaveAsync(SaveOrganizationProfileRequest request, CancellationToken cancellationToken = default)
    {
        var name = request.Name?.Trim() ?? string.Empty;
        var city = request.City?.Trim() ?? string.Empty;
        var email = string.IsNullOrWhiteSpace(request.ContactEmail) ? null : request.ContactEmail.Trim().ToLowerInvariant();
        var phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();
        var timeZone = request.TimeZone?.Trim() ?? string.Empty;
        var errors = new Dictionary<string, string>();
        Required(name, "name", "Enter your organization’s name.", errors);
        Required(city, "city", "Enter the city you work in.", errors);
        if (email is not null && !EmailAddressRule.IsValid(email))
        {
            errors["contactEmail"] = EmailAddressRule.Message;
        }
        if (phone is not null && ContactMask.Digits(phone).Length != 10)
        {
            errors["phone"] = "Include the area code, like 905-555-0100.";
        }
        if (!OrganizationTimeZones.All.Contains(timeZone))
        {
            errors["timeZone"] = "Choose a time zone from the list.";
        }
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }
        var organization = await db.Organizations.SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        var changed = new List<string>();
        if (organization.Name != name) changed.Add("name");
        if (organization.City != city) changed.Add("city");
        if (organization.ContactEmail != email) changed.Add("contact email");
        if (organization.Phone != phone) changed.Add("phone");
        if (organization.TimeZone != timeZone) changed.Add("time zone");
        organization.ChangeDetails(name, city, email, phone, timeZone);
        if (changed.Count > 0)
        {
            audit.Record(new AuditEvent(AuditAction.Updated, "Organization", organization.Id, $"Organization profile: {string.Join(", ", changed)} changed by {tenant.ActorName}"));
        }
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    private static void Required(string value, string field, string empty, Dictionary<string, string> errors)
    {
        if (value.Length == 0)
        {
            errors[field] = empty;
        }
        else if (value.Length > Maximum)
        {
            errors[field] = $"Use at most {Maximum} characters.";
        }
    }
}
