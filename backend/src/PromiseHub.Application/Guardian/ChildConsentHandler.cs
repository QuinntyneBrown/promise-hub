using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;

namespace PromiseHub.Application.Guardian;

/// <summary>Staff read a child's consent status and send a consent link (L2-058 criteria 3 to 5); another organization's child is not found.</summary>
public sealed class ChildConsentHandler(IPromiseHubDb db, ConsentGate gate, ConsentRequestSender sender, ITenantContext tenant)
{
    public async Task<ChildConsentDto?> GetAsync(Guid childId, CancellationToken cancellationToken = default)
    {
        if (!await db.Children.AsNoTracking().AnyAsync(c => c.Id == childId, cancellationToken))
        {
            return null;
        }
        var status = await gate.StatusAsync(childId, cancellationToken);
        var sent = (await db.GuardianLinks.AsNoTracking().Where(l => l.ChildId == childId && l.ForConsent).Select(l => l.CreatedAt).ToListAsync(cancellationToken))
            .OrderDescending().Cast<DateTimeOffset?>().FirstOrDefault();
        var latest = status.Latest;
        return new ChildConsentDto(status.Required, status.ConsentAge, status.Name, latest?.SignedBy, latest?.Relationship, latest?.SignedAt, latest?.Reference,
            latest?.WithdrawnAt, latest?.WithdrawnBy, sent);
    }

    public async Task<ConsentRequestResult> SendAsync(Guid childId, CancellationToken cancellationToken = default)
    {
        var child = await db.Children.AsNoTracking().FirstOrDefaultAsync(c => c.Id == childId, cancellationToken);
        return child is null
            ? new ConsentRequestResult(ConsentRequestOutcome.NotFound, [])
            : await sender.SendAsync(child, tenant.ActorName, cancellationToken);
    }
}
