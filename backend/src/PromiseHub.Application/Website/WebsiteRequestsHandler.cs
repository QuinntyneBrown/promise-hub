using PromiseHub.Application.Audit;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Website;

namespace PromiseHub.Application.Website;

/// <summary>
/// Requests a visitor sends from an organization's public website (L2-134, ADR 0075): validated on the server, limited per email, stored
/// for the organization the address names and audited with the actor "Website visitor".
/// </summary>
public sealed class WebsiteRequestsHandler(IPromiseHubDb db, PublicSiteResolver sites, WebsiteRequestLimit limit, IAuditWriter audit, TimeProvider clock)
{
    public async Task<WebsiteResult> ContactAsync(string slug, ContactRequest request, CancellationToken cancellationToken = default)
    {
        if (await sites.ResolveAsync(slug, cancellationToken) is not { } organization)
        {
            return WebsiteResult.NotFound;
        }
        var name = WebsiteRules.Clean(request.Name);
        var email = WebsiteRules.Clean(request.Email)?.ToLowerInvariant();
        var topic = WebsiteRules.Clean(request.Topic);
        var message = WebsiteRules.Clean(request.Message);
        var errors = new Dictionary<string, string>();
        WebsiteRules.Name(name, errors);
        WebsiteRules.Email(email, errors);
        if (topic is null || !WebsiteChoices.Topics.Contains(topic))
        {
            errors["topic"] = "Choose a topic.";
        }
        if (message is null)
        {
            errors["message"] = "Write your message.";
        }
        else if (message.Length > ContactMessage.MaximumMessage)
        {
            errors["message"] = "Use at most 2,000 characters.";
        }
        if (errors.Count > 0)
        {
            return WebsiteResult.Invalid(errors);
        }
        if (await limit.ReachedAsync(WebsiteRequestKind.Contact, email!, cancellationToken))
        {
            return WebsiteResult.TooMany;
        }
        var row = new ContactMessage(Guid.NewGuid(), organization.Id, name!, email!, topic!, message!, clock.GetUtcNow());
        db.ContactMessages.Add(row);
        audit.Record(new AuditEvent(AuditAction.Created, nameof(ContactMessage), row.Id, $"Website message: {topic}"));
        await db.SaveChangesAsync(cancellationToken);
        return WebsiteResult.Done;
    }

    public async Task<WebsiteResult> VolunteerAsync(string slug, VolunteerRequest request, CancellationToken cancellationToken = default)
    {
        if (await sites.ResolveAsync(slug, cancellationToken) is not { } organization)
        {
            return WebsiteResult.NotFound;
        }
        var name = WebsiteRules.Clean(request.Name);
        var email = WebsiteRules.Clean(request.Email)?.ToLowerInvariant();
        var phone = WebsiteRules.Clean(request.Phone);
        var area = WebsiteRules.Clean(request.Area);
        var about = WebsiteRules.Clean(request.About);
        var errors = new Dictionary<string, string>();
        WebsiteRules.Name(name, errors);
        WebsiteRules.Email(email, errors);
        if (phone is { Length: > VolunteerInterest.MaximumPhone })
        {
            errors["phone"] = "Enter a phone number of up to 30 characters.";
        }
        if (area is null || !WebsiteChoices.Areas.Contains(area))
        {
            errors["area"] = "Choose how you’d like to help.";
        }
        if (about is { Length: > VolunteerInterest.MaximumAbout })
        {
            errors["about"] = "Use at most 1,000 characters.";
        }
        if (!request.ScreeningAcknowledged)
        {
            errors["screeningAcknowledged"] = "Tick the box to say you understand volunteers are screened.";
        }
        if (errors.Count > 0)
        {
            return WebsiteResult.Invalid(errors);
        }
        if (await limit.ReachedAsync(WebsiteRequestKind.Volunteer, email!, cancellationToken))
        {
            return WebsiteResult.TooMany;
        }
        var row = new VolunteerInterest(Guid.NewGuid(), organization.Id, name!, email!, phone, area!, about, true, clock.GetUtcNow());
        db.VolunteerInterests.Add(row);
        audit.Record(new AuditEvent(AuditAction.Created, nameof(VolunteerInterest), row.Id, $"Volunteer offer: {area}"));
        await db.SaveChangesAsync(cancellationToken);
        return WebsiteResult.Done;
    }
}
