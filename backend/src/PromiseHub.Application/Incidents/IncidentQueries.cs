using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;

namespace PromiseHub.Application.Incidents;

/// <summary>The incident list, one incident (each view audited, L2-023 criterion 4) and the form's choices, under <see cref="IncidentAccess"/>.</summary>
public sealed class IncidentQueries(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit)
{
    public async Task<IncidentListDto> ListAsync(CancellationToken cancellationToken = default)
    {
        var incidents = await IncidentAccess.Readable(db.Incidents.AsNoTracking(), tenant.Role, tenant.MembershipId).ToListAsync(cancellationToken);
        var names = await Names(incidents.Select(i => i.ChildId), cancellationToken);
        return new IncidentListDto(IncidentAccess.ReadsLog(tenant.Role), [.. incidents
            .OrderBy(i => i.Status == Domain.Incidents.IncidentStatus.Closed).ThenByDescending(i => i.ReportedAt)
            .Select(i => new IncidentSummaryDto(i.Id, i.Category.ToString(), names.GetValueOrDefault(i.ChildId, ""), i.OccurredAt, i.Severity.ToString(), i.Status.ToString(), i.ReportedBy))]);
    }

    public async Task<IncidentDto?> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var i = await IncidentAccess.Readable(db.Incidents.AsNoTracking(), tenant.Role, tenant.MembershipId).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (i is null)
        {
            return null;
        }
        var child = (await Names([i.ChildId], cancellationToken)).GetValueOrDefault(i.ChildId, "");
        audit.Record(new AuditEvent(AuditAction.Viewed, "Incident", i.Id, $"Viewed by {tenant.ActorName}"));
        await db.SaveChangesAsync(cancellationToken);
        var followUps = await db.IncidentFollowUps.AsNoTracking().Where(f => f.IncidentId == i.Id).ToListAsync(cancellationToken);
        var trail = await db.AuditEntries.AsNoTracking().Where(a => a.RecordType == "Incident" && a.RecordId == i.Id).ToListAsync(cancellationToken);
        return new IncidentDto(i.Id, i.Category.ToString(), i.ChildId, child, i.OccurredAt, i.Place, i.WhatHappened, i.ActionTaken, i.GuardianContact.ToString(),
            i.Severity.ToString(), i.Status.ToString(), i.ReportedBy, i.ReportedAt, IncidentAccess.ReadsLog(tenant.Role),
            i.ReviewNote is null ? null : new IncidentReviewDto(i.ReviewNote, i.Outcome!.Value.ToString(), i.ReviewedBy!, i.ReviewedAt!.Value),
            [.. followUps.OrderBy(f => f.WrittenAt).Select(f => new IncidentFollowUpDto(f.Text, f.WrittenBy, f.WrittenAt))],
            [.. trail.OrderBy(a => a.OccurredAt).Select(a => new IncidentTrailDto(Trail(a), a.OccurredAt))]);
    }

    public async Task<IncidentFormDto> FormAsync(CancellationToken cancellationToken = default)
    {
        var supervisor = await db.Memberships.AsNoTracking().Where(m => m.Role == Domain.Organizations.Role.ProgramDirector && m.RemovedAt == null)
            .OrderBy(m => m.PersonName).Select(m => m.PersonName).FirstOrDefaultAsync(cancellationToken);
        var children = (await db.Children.AsNoTracking().ToListAsync(cancellationToken)).OrderBy(c => c.FirstName).ThenBy(c => c.LastName)
            .Select(c => new IncidentChildDto(c.Id, c.FullName)).ToList();
        return new IncidentFormDto(supervisor, children);
    }

    private static string Trail(Domain.Audit.AuditEntry entry) => entry.Action switch
    {
        AuditAction.Created => $"{entry.ActorName} submitted the report",
        AuditAction.Viewed => $"{entry.ActorName} opened the report",
        _ => $"{entry.ActorName}: {entry.Summary}",
    };

    private async Task<Dictionary<Guid, string>> Names(IEnumerable<Guid> ids, CancellationToken cancellationToken)
    {
        var list = ids.Distinct().ToList();
        return (await db.Children.AsNoTracking().IgnoreQueryFilters().Where(c => list.Contains(c.Id) && c.OrganizationId == tenant.OrganizationId).ToListAsync(cancellationToken))
            .ToDictionary(c => c.Id, c => c.FullName);
    }
}
