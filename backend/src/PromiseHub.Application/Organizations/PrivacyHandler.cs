using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Organizations;

/// <summary>Privacy settings (L2-030): reading the region, choosing consent retention. Saving is audited.</summary>
public sealed class PrivacyHandler(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit)
{
    public async Task<PrivacySettingsDto> GetAsync(CancellationToken cancellationToken = default)
    {
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        var row = await db.PrivacySettings.AsNoTracking().FirstOrDefaultAsync(cancellationToken);
        return new PrivacySettingsDto(organization.Region, row is null ? PrivacySettings.DefaultConsentRetentionYears : row.ConsentRetentionYears);
    }

    public async Task<Result> SaveAsync(SavePrivacyCommand command, CancellationToken cancellationToken = default)
    {
        if (command.ConsentRetentionYears is { } years && !PrivacySettings.ConsentRetentionChoices.Contains(years))
        {
            return Result.Invalid(new Dictionary<string, string> { ["consentRetentionYears"] = "Choose 7 years, 3 years or until deleted by request." });
        }
        var row = await db.PrivacySettings.FirstOrDefaultAsync(cancellationToken);
        if (row is null)
        {
            row = new PrivacySettings(Guid.NewGuid(), tenant.OrganizationId);
            db.PrivacySettings.Add(row);
        }
        row.Change(command.ConsentRetentionYears);
        audit.Record(new AuditEvent(AuditAction.Updated, "PrivacySettings", row.Id,
            command.ConsentRetentionYears is { } y ? $"Keep consent records {y} years after the event" : "Keep consent records until deleted by request"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
