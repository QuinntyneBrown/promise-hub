using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Domain.Audit;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// Destroys a SIN's ciphertext and keeps its last three digits (L2-159 criterion 4), audited without the value (L2-161 criterion 4). The
/// daily destruction job calls it once the applications that used the SIN are received or cancelled; the job arrives with the claim.
/// </summary>
public sealed class LearningBondSinDestroyer(IPromiseHubDb db, IAuditWriter audit, TimeProvider clock)
{
    /// <summary>False when the intake is not the tenant's or its SIN was already destroyed.</summary>
    public async Task<bool> DestroyGuardianSinAsync(Guid intakeId, CancellationToken cancellationToken = default)
    {
        var intake = await db.LearningBondIntakes.FirstOrDefaultAsync(i => i.Id == intakeId, cancellationToken);
        if (intake is null || !intake.DestroyGuardianSin(clock.GetUtcNow()))
        {
            return false;
        }
        audit.Record(new AuditEvent(AuditAction.Deleted, "LearningBondIntake", intake.Id, "Learning Bond: guardian SIN destroyed; last three digits kept"));
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
