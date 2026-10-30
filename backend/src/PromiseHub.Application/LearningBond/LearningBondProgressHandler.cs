using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Guardian;
using PromiseHub.Domain.LearningBond;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// The submitted view (L2-150 criterion 1): the child's sent application with the provider, the date, the fields as sent, the estimate, the
/// steps reached and the deposit window from the provider's stated processing days, counted from the day it was sent where the organization is.
/// </summary>
public sealed class LearningBondProgressHandler(IPromiseHubDb db, LearningBondGuardianScope guardianScope, LearningBondClaimFinder claims,
    LearningBondApplicationHandler applications)
{
    public async Task<GuardianResult> GetAsync(GuardianRequest request, Guid childId, CancellationToken cancellationToken = default)
    {
        var (gate, scope) = await guardianScope.TrustedAsync(request, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        if (await claims.ForChildAsync(scope!.Household.Id, childId, cancellationToken: cancellationToken) is not { } claim)
        {
            return GuardianResult.Of(GuardianOutcome.Forbidden);
        }
        var application = (await db.LearningBondApplications.AsNoTracking().Where(a => a.ClaimId == claim.Id).ToListAsync(cancellationToken))
            .Where(a => a.SubmittedAt is not null).OrderByDescending(a => a.SubmittedAt).FirstOrDefault();
        if (application is null || RespProviders.Named(application.Provider) is not { } provider)
        {
            return GuardianResult.Of(GuardianOutcome.Conflict, new { code = "not-submitted" });
        }
        var review = await applications.DtoAsync(scope, application, cancellationToken);
        var zone = TimeZoneInfo.FindSystemTimeZoneById(scope.Organization.TimeZone);
        var sent = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(application.SubmittedAt!.Value, zone).DateTime);
        var document = await db.LearningBondDocuments.AsNoTracking().Where(d => d.ApplicationId == application.Id && d.SentAt == null)
            .OrderByDescending(d => d.RequestedAt).FirstOrDefaultAsync(cancellationToken);
        var code = GuardianLanguage.Code(scope.Household.Language);
        return GuardianResult.Of(GuardianOutcome.Ok, new LearningBondProgressDto(code, scope.Organization.Name, AgentFallbackCopy.Submitted(code, provider.Name),
            application.Id, childId, review.FirstName, provider.Name, application.Status.ToString(), application.SubmittedAt.Value, claim.EstimateAmount,
            application.DepositAmount, StepsDone(application.Status), sent.AddDays(provider.ProcessingDaysMin), sent.AddDays(provider.ProcessingDaysMax),
            review.Fields, document is null ? null : new LearningBondDocumentRequestDto(document.Id, document.Name, document.FileName, document.SentAt)));
    }

    /// <summary>The provider received it (1), the Government approved it (2, known only once it is deposited) and the deposit landed (3).</summary>
    private static int StepsDone(LearningBondApplicationStatus status) => status switch
    {
        LearningBondApplicationStatus.Received => 1,
        LearningBondApplicationStatus.Deposited => 3,
        _ => 0,
    };
}
