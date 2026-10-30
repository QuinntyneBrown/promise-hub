using Microsoft.EntityFrameworkCore;

namespace PromiseHub.Application.LearningBond;

/// <summary>Whether the tenant has accepted the current version of the data-handling agreement (L2-135 criterion 4, L2-136).</summary>
public sealed class LearningBondAgreementGate(IPromiseHubDb db)
{
    public async Task<bool> IsAcceptedAsync(CancellationToken cancellationToken = default)
    {
        var current = await db.LearningBondAgreements.AsNoTracking().OrderByDescending(a => a.Version).Select(a => (int?)a.Version).FirstOrDefaultAsync(cancellationToken);
        return current is { } version && await db.LearningBondAgreementAcceptances.AnyAsync(a => a.AgreementVersion == version, cancellationToken);
    }
}
