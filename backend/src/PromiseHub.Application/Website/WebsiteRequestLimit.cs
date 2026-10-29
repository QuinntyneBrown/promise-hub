using Microsoft.EntityFrameworkCore;

namespace PromiseHub.Application.Website;

/// <summary>
/// At most five requests of one kind from one email to one organization within an hour (L2-134 criterion 4, ADR 0075), counted from the
/// stored rows of the resolved organization, so no other state is needed.
/// </summary>
public sealed class WebsiteRequestLimit(IPromiseHubDb db, TimeProvider clock)
{
    public const int PerHour = 5;

    public async Task<bool> ReachedAsync(WebsiteRequestKind kind, string email, CancellationToken cancellationToken = default)
    {
        var since = clock.GetUtcNow().AddHours(-1);
        var count = kind switch
        {
            WebsiteRequestKind.Contact => await db.ContactMessages.CountAsync(m => m.Email == email && m.CreatedAt > since, cancellationToken),
            WebsiteRequestKind.Volunteer => await db.VolunteerInterests.CountAsync(v => v.Email == email && v.CreatedAt > since, cancellationToken),
            _ => await db.DonationPledges.CountAsync(d => d.Email == email && d.CreatedAt > since, cancellationToken),
        };
        return count >= PerHour;
    }
}
