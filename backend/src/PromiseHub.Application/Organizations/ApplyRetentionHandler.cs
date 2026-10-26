using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Organizations;
using PromiseHub.Domain.Slips;

namespace PromiseHub.Application.Organizations;

/// <summary>
/// Part of the per-tenant retention job (L2-030 criterion 2): signatures on slips whose event is older than the
/// organization's consent retention lose who signed and the details; their status stays, so counts are unchanged.
/// </summary>
public sealed class ApplyRetentionHandler(IPromiseHubDb db, TimeProvider clock)
{
    public async Task HandleAsync(CancellationToken cancellationToken = default)
    {
        var row = await db.PrivacySettings.AsNoTracking().FirstOrDefaultAsync(cancellationToken);
        var years = row is null ? PrivacySettings.DefaultConsentRetentionYears : row.ConsentRetentionYears;
        if (years is null)
        {
            return;
        }
        var cutoff = clock.GetUtcNow().AddYears(-years.Value);
        var note = $"Removed after {years} years";
        var expired = await (
            from s in db.SlipSignatures
            join p in db.PermissionSlips on s.SlipId equals p.Id
            join e in db.Events on p.EventId equals e.Id
            select new { Signature = s, e.StartsAt }).ToListAsync(cancellationToken);
        foreach (var x in expired.Where(x => x.StartsAt < cutoff && x.Signature.SignedBy != note))
        {
            x.Signature.Purge(note);
        }
        await db.SaveChangesAsync(cancellationToken);
    }
}
