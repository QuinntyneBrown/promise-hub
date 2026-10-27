using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Learning;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Curriculum;
using PromiseHub.Domain.Notifications;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Curriculum;

/// <summary>
/// A program director awards a badge by hand (L2-085 criteria 4 to 6, ADR 0058): only a badge by hand, only to an active youth of the
/// organization, once. The award carries her name; the youth is notified and the award audited.
/// </summary>
public sealed class BadgeAwardCommand(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit, TimeProvider clock)
{
    public async Task<Gated<Guid>> AwardAsync(Guid badgeId, AwardBadgeRequest request, CancellationToken cancellationToken = default)
    {
        var badge = await db.Badges.AsNoTracking().FirstOrDefaultAsync(b => b.Id == badgeId && b.DeletedAt == null, cancellationToken);
        if (badge is null)
        {
            return Gated<Guid>.NotFound();
        }
        if (badge.Kind != BadgeKind.Manual)
        {
            return Gated<Guid>.Conflict("automatic");
        }
        var youth = request.MembershipId is { } id
            ? await db.Memberships.AsNoTracking().FirstOrDefaultAsync(m => m.Id == id && m.Role == Role.Youth && m.RemovedAt == null, cancellationToken)
            : null;
        if (youth is null)
        {
            return Gated<Guid>.Invalid(new Dictionary<string, string> { ["membershipId"] = "Choose a youth of your organization." });
        }
        if (await db.BadgeAwards.AnyAsync(a => a.BadgeId == badgeId && a.MembershipId == youth.Id, cancellationToken))
        {
            return Gated<Guid>.Conflict("already-awarded");
        }
        var now = clock.GetUtcNow();
        var award = new BadgeAward(Guid.NewGuid(), tenant.OrganizationId, badgeId, youth.Id, now, tenant.ActorName);
        db.BadgeAwards.Add(award);
        db.Notifications.Add(new Notification(Guid.NewGuid(), tenant.OrganizationId, youth.Id, "learning", $"{tenant.ActorName} awarded you the {badge.Name} badge.", "/learning", now));
        audit.Record(new AuditEvent(AuditAction.Created, "BadgeAward", award.Id, $"{badge.Name} awarded to {youth.PersonName} by {tenant.ActorName}"));
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            // Another award of the same badge to the same youth saved first; the unique index keeps one.
            return Gated<Guid>.Conflict("already-awarded");
        }
        return Gated<Guid>.Found(award.Id);
    }
}
