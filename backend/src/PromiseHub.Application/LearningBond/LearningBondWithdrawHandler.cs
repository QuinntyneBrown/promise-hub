using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.LearningBond;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// Withdrawing a child's Learning Bond consent (L2-152, L2-159), in one unit of work: the consent is withdrawn; every application not yet
/// sent is cancelled; the child's SIN is destroyed; the guardian's SIN and the tax answer go too when no other child still has consent;
/// every reminder about the child stops and any document not yet sent is deleted. An application already sent keeps its status, provider
/// and dates, with no SIN. Audited without a value. Another household's consent is unknown.
/// </summary>
public sealed class LearningBondWithdrawHandler(IPromiseHubDb db, LearningBondGuardianScope guardianScope, IFileStore files, IAuditWriter audit, TimeProvider clock)
{
    public async Task<GuardianResult> WithdrawAsync(GuardianRequest request, Guid consentId, CancellationToken cancellationToken = default)
    {
        var (gate, scope) = await guardianScope.TrustedAsync(request, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        var consent = await db.LearningBondConsents.FirstOrDefaultAsync(c => c.Id == consentId && c.HouseholdId == scope!.Household.Id
            && c.Scope == LearningBondConsentScope.LearningBond && c.WithdrawnAt == null && c.ClosedAt == null, cancellationToken);
        if (consent is null)
        {
            return GuardianResult.Of(GuardianOutcome.NotFound);
        }
        var now = clock.GetUtcNow();
        consent.Withdraw(now);
        var claims = await db.LearningBondClaims.Where(c => c.ConsentId == consent.Id).ToListAsync(cancellationToken);
        var claimIds = claims.Select(c => c.Id).ToList();
        foreach (var claim in claims)
        {
            claim.Withdraw(now);
        }
        var applications = await db.LearningBondApplications.Where(a => claimIds.Contains(a.ClaimId)).ToListAsync(cancellationToken);
        foreach (var application in applications)
        {
            application.Cancel(now);
        }
        foreach (var reminder in (await db.LearningBondReminders.Where(r => claimIds.Contains(r.ClaimId)).ToListAsync(cancellationToken)).Where(r => r.Open))
        {
            reminder.Cancel(now);
        }
        var applicationIds = applications.Select(a => a.Id).ToList();
        foreach (var document in await db.LearningBondDocuments.Where(d => applicationIds.Contains(d.ApplicationId) && d.SentAt == null && d.StorageKey != null)
            .ToListAsync(cancellationToken))
        {
            await files.DeleteAsync(document.StorageKey!, cancellationToken);
            db.LearningBondDocuments.Remove(document);
        }
        var others = await db.LearningBondConsents.AnyAsync(c => c.HouseholdId == consent.HouseholdId && c.Id != consent.Id
            && c.Scope == LearningBondConsentScope.LearningBond && c.WithdrawnAt == null && c.ClosedAt == null, cancellationToken);
        if (!others && await db.LearningBondIntakes.FirstOrDefaultAsync(i => i.HouseholdId == consent.HouseholdId, cancellationToken) is { } intake)
        {
            intake.ClearAnswers(now);
        }
        var child = await db.Children.AsNoTracking().Where(c => c.Id == consent.ChildId).Select(c => c.FirstName).SingleAsync(cancellationToken);
        audit.Record(new AuditEvent(AuditAction.Withdrawn, nameof(LearningBondConsent), consent.Id, $"Learning Bond consent withdrawn for {child}"));
        await db.SaveChangesAsync(cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Done);
    }
}
