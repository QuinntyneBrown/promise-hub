using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Messaging;

namespace PromiseHub.Application.Messaging;

/// <summary>
/// A youth's or mentor's announcements (L2-105 criteria 5 and 6): only those aimed at her role and programs and sent by now, newest first;
/// Mark all read records a read for her alone. Reading is not audited: it changes no record anyone relies on.
/// </summary>
public sealed class MyAnnouncementsHandler(IPromiseHubDb db, ITenantContext tenant, AnnouncementRecipients recipients, TimeProvider clock)
{
    public async Task<MyAnnouncementsDto> GetAsync(CancellationToken cancellationToken = default)
    {
        var visible = (await recipients.VisibleToAsync(tenant.MembershipId, clock.GetUtcNow(), cancellationToken)).OrderByDescending(a => a.SendAt).ToList();
        var ids = visible.Select(a => a.Id).ToList();
        var read = (await db.AnnouncementReads.AsNoTracking().Where(r => r.MembershipId == tenant.MembershipId && ids.Contains(r.AnnouncementId))
            .Select(r => r.AnnouncementId).ToListAsync(cancellationToken)).ToHashSet();
        var programIds = visible.Where(a => a.ProgramId != null).Select(a => a.ProgramId!.Value).Distinct().ToList();
        var programs = await db.Programs.AsNoTracking().Where(p => programIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id, p => p.Name, cancellationToken);
        var items = visible.Select(a => new MyAnnouncementDto(a.Id, a.Title, a.Body, a.CreatedBy, RoleWords.Of(a.CreatedByRole), a.SendAt,
            a.ProgramId is { } p ? programs.GetValueOrDefault(p) : null, read.Contains(a.Id))).ToList();
        return new MyAnnouncementsDto(items.Count(i => !i.Read), items);
    }

    public async Task MarkAllReadAsync(CancellationToken cancellationToken = default)
    {
        var now = clock.GetUtcNow();
        var visible = await recipients.VisibleToAsync(tenant.MembershipId, now, cancellationToken);
        var ids = visible.Select(a => a.Id).ToList();
        var read = (await db.AnnouncementReads.Where(r => r.MembershipId == tenant.MembershipId && ids.Contains(r.AnnouncementId))
            .Select(r => r.AnnouncementId).ToListAsync(cancellationToken)).ToHashSet();
        foreach (var id in ids.Where(id => !read.Contains(id)))
        {
            db.AnnouncementReads.Add(new AnnouncementRead(Guid.NewGuid(), tenant.OrganizationId, id, tenant.MembershipId, now));
        }
        await db.SaveChangesAsync(cancellationToken);
    }
}
