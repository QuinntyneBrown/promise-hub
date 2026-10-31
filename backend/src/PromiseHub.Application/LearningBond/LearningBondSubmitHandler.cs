using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.LearningBond;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// Submit (L2-149, L2-159): the guardian's own request from a verified device, quoting the review's current version, is the only way an
/// application leaves, and the only place the SINs are decrypted. It is sent once: the submission key is written before the provider's channel
/// is called, and a repeat answers the same without sending again. A provider that refuses leaves it ready to submit for a retry.
/// </summary>
public sealed class LearningBondSubmitHandler(IPromiseHubDb db, LearningBondApplicationHandler applications, ILearningBondCipher cipher, IRespProviderChannel channel,
    IAuditWriter audit, TimeProvider clock)
{
    public async Task<GuardianResult> SubmitAsync(GuardianRequest request, Guid applicationId, SubmitLearningBondApplicationRequest submit,
        CancellationToken cancellationToken = default)
    {
        var (gate, scope, application) = await applications.OwnAsync(request, applicationId, cancellationToken, editable: false);
        if (gate is not null)
        {
            return gate;
        }
        if (application!.Status is LearningBondApplicationStatus.Submitted or LearningBondApplicationStatus.Received or LearningBondApplicationStatus.Deposited)
        {
            return Accepted(application);
        }
        if (submit.ReviewVersion != application.ReviewVersion)
        {
            return GuardianResult.Of(GuardianOutcome.Conflict, new { code = "stale-review" });
        }
        if (application.Status != LearningBondApplicationStatus.ReadyToSubmit || RespProviders.Named(application.Provider) is not { } provider)
        {
            return GuardianResult.Of(GuardianOutcome.Conflict, new { code = "incomplete" });
        }
        if (!cipher.IsAvailable)
        {
            return GuardianResult.Of(GuardianOutcome.Unavailable);
        }
        var claim = await db.LearningBondClaims.SingleAsync(c => c.Id == application.ClaimId, cancellationToken);
        var intake = await db.LearningBondIntakes.AsNoTracking().SingleAsync(i => i.HouseholdId == scope!.Household.Id, cancellationToken);
        if (claim.ChildSin is not { IsDestroyed: false } childSin || intake.GuardianSin is not { IsDestroyed: false } guardianSin)
        {
            return GuardianResult.Of(GuardianOutcome.Conflict, new { code = "incomplete" });
        }
        var key = application.BeginSubmission();
        await db.SaveChangesAsync(cancellationToken);
        var review = await applications.DtoAsync(scope!, application, cancellationToken);
        var result = await channel.SubmitAsync(new RespSubmission(key, provider.Name, provider.Channel, review.Fields.BeneficiaryName, review.Fields.DateOfBirth,
            cipher.Decrypt(childSin), review.Fields.CaregiverName, cipher.Decrypt(guardianSin), application.Address!, application.Phone, application.Email,
            review.Fields.Language), cancellationToken);
        if (!result.Sent)
        {
            return GuardianResult.Of(GuardianOutcome.NotSent);
        }
        var now = clock.GetUtcNow();
        application.MarkSubmitted(result.Reference, now);
        claim.MarkSubmitted(now);
        // Never a SIN in the audit (L2-159, L2-161).
        audit.Record(new AuditEvent(AuditAction.Submitted, nameof(LearningBondApplication), application.Id,
            $"Learning Bond application for {review.FirstName} submitted to {provider.Name}"));
        await db.SaveChangesAsync(cancellationToken);
        return Accepted(application);
    }

    private static GuardianResult Accepted(LearningBondApplication application) =>
        GuardianResult.Of(GuardianOutcome.Accepted, new { id = application.Id, status = application.Status.ToString(), reference = application.ProviderReference });
}
