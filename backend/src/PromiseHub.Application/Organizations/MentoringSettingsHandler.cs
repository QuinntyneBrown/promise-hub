using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Organizations;

/// <summary>Mentoring's defaults (L2-125, ADR 0073): the check-in cadence of the signed-in membership's organization; saving is audited.</summary>
public sealed class MentoringSettingsHandler(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit)
{
    public async Task<MentoringSettingsDto> GetAsync(CancellationToken cancellationToken = default)
    {
        var days = await db.Organizations.AsNoTracking().Where(o => o.Id == tenant.OrganizationId).Select(o => o.MentorCheckInDays).SingleAsync(cancellationToken);
        return new MentoringSettingsDto(days);
    }

    public async Task<Result> SaveAsync(SaveMentoringSettingsRequest request, CancellationToken cancellationToken = default)
    {
        if (request.CheckInEveryDays is not { } days || !Organization.MentorCheckInCadences.Contains(days))
        {
            return Result.Invalid(new Dictionary<string, string> { ["checkInEveryDays"] = "Choose 7, 14, 21 or 30 days." });
        }
        var organization = await db.Organizations.SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        var before = organization.MentorCheckInDays;
        organization.ChangeMentorCheckInDays(days);
        audit.Record(new AuditEvent(AuditAction.Updated, "MentoringSettings", organization.Id, $"Mentors check in every {days} days, set by {tenant.ActorName}",
            new { CheckInEveryDays = before }, new { CheckInEveryDays = days }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
