using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;

namespace PromiseHub.Application.Guardian;

/// <summary>A gated youth asks a guardian for consent (L2-056 criteria 3 and 4): the link goes to the household of the caller's own linked child.</summary>
public sealed class ConsentRequestHandler(IPromiseHubDb db, ITenantContext tenant, ConsentRequestSender sender)
{
    public async Task<ConsentRequestResult> RequestAsync(CancellationToken cancellationToken = default)
    {
        var childId = await db.Memberships.AsNoTracking().Where(m => m.Id == tenant.MembershipId).Select(m => m.ChildId).FirstOrDefaultAsync(cancellationToken);
        var child = childId is { } id ? await db.Children.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, cancellationToken) : null;
        return child is null
            ? new ConsentRequestResult(ConsentRequestOutcome.NotNeeded, [])
            : await sender.SendAsync(child, tenant.ActorName, cancellationToken);
    }
}
