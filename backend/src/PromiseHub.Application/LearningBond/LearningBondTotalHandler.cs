using PromiseHub.Application.Guardian;

namespace PromiseHub.Application.LearningBond;

/// <summary>The guardian's running total (L2-158 criteria 1, 3 and 4): their household's only; staff have no route to it.</summary>
public sealed class LearningBondTotalHandler(LearningBondGuardianScope guardianScope, LearningBondTotals totals)
{
    public async Task<GuardianResult> GetAsync(GuardianRequest request, CancellationToken cancellationToken = default)
    {
        var (gate, scope) = await guardianScope.TrustedAsync(request, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        var lines = await totals.LinesAsync(scope!.Household.Id, scope.Organization.TimeZone, cancellationToken);
        var confirmed = lines.Where(l => l.Confirmed).Sum(l => l.Amount);
        return GuardianResult.Of(GuardianOutcome.Ok, new LearningBondTotalDto(GuardianLanguage.Code(scope.Household.Language), scope.Organization.Name, confirmed,
            lines.Where(l => !l.Confirmed).Sum(l => l.Amount), confirmed == 0, lines));
    }
}
