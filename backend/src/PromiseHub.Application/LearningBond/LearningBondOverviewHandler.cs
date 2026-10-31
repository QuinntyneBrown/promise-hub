using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.LearningBond;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// The Settings › Learning Bond hub (L2-136 criteria 4 and 9, ADR 0076): one read of the agreement, coverage and invitation. While a new
/// agreement version is pending, Learning Bond stays on and Launch is disabled; launching itself is prompt 85.
/// </summary>
public sealed class LearningBondOverviewHandler(IPromiseHubDb db, ITenantContext tenant, LearningBondCoverage coverage, LearningBondInvitationHandler invitation)
{
    public const string NewVersionMessage = "A new version of the agreement needs accepting.";

    public async Task<LearningBondOverviewDto> GetAsync(CancellationToken cancellationToken = default)
    {
        var agreement = await db.LearningBondAgreements.AsNoTracking().OrderByDescending(a => a.Version).FirstAsync(cancellationToken);
        var acceptance = await db.LearningBondAgreementAcceptances.AsNoTracking().OrderByDescending(a => a.AgreementVersion).ThenByDescending(a => a.AcceptedAt)
            .FirstOrDefaultAsync(cancellationToken);
        var pending = acceptance?.AgreementVersion != agreement.Version;
        var settings = await db.LearningBondSettings.AsNoTracking().FirstOrDefaultAsync(cancellationToken)
            ?? new LearningBondSettings(Guid.Empty, tenant.OrganizationId, DateTimeOffset.MinValue);
        var chosen = settings.Coverage == LearningBondCoverageMode.ChosenPrograms ? settings.Programs : null;
        var programs = chosen is null ? [] : await db.Programs.AsNoTracking().Where(p => chosen.Contains(p.Id)).OrderBy(p => p.Name).Select(p => p.Name).ToListAsync(cancellationToken);
        var organization = await db.Organizations.AsNoTracking().Where(o => o.Id == tenant.OrganizationId).Select(o => o.Name).SingleAsync(cancellationToken);
        return new LearningBondOverviewDto(
            agreement.Version,
            acceptance is null ? null : new LearningBondAcceptanceDto(acceptance.AgreementVersion, acceptance.AcceptedByName, acceptance.AcceptedAt),
            pending ? agreement.Version : null,
            pending ? agreement.EffectiveOn : null,
            settings.Coverage.ToString(),
            programs,
            await coverage.CountAsync(chosen, cancellationToken),
            [.. settings.Roles.Select(r => r.ToString())],
            await invitation.SenderNameAsync(organization, cancellationToken),
            await invitation.LanguagesAsync(cancellationToken),
            pending ? NewVersionMessage : null);
    }
}
