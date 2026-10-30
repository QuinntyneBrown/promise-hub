using Microsoft.EntityFrameworkCore;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// The named signer's own page behind the emailed link (L2-137, ADR 0078): anonymous, outside the Learning Bond module gate because the
/// agreement is accepted before the module can be on. It reads the agreement and the request only, never a household.
/// </summary>
public sealed class LearningBondSignerLinkHandler(IPromiseHubDb db, LearningBondSignerLinkAccess access)
{
    public async Task<LearningBondSignerOutcome<LearningBondSignerAgreementDto>> GetAsync(string token, CancellationToken cancellationToken = default)
    {
        var link = await access.ResolveAsync(token, cancellationToken);
        if (link is not { Status: LearningBondSignerLinkStatus.Open, Request: { } request })
        {
            return Closed<LearningBondSignerAgreementDto>(link);
        }
        var agreement = await db.LearningBondAgreements.AsNoTracking().OrderByDescending(a => a.Version).FirstAsync(cancellationToken);
        return new(LearningBondSignerLinkStatus.Open, new LearningBondSignerAgreementDto(link.Organization!, request.RequestedByName, request.Name, request.Title,
            agreement.Version, agreement.EffectiveOn,
            [new("What we collect", agreement.WhatWeCollect), new("Where it goes", agreement.WhereItGoes), new("What your organization sees", agreement.WhatYourOrganizationSees)]));
    }

    public async Task<LearningBondSignerOutcome<object>> AcceptAsync(string token, AcceptAgreementRequest request, CancellationToken cancellationToken = default)
    {
        var link = await access.ResolveAsync(token, cancellationToken);
        if (link.Status != LearningBondSignerLinkStatus.Open)
        {
            return Closed<object>(link);
        }
        if (!request.Authority)
        {
            return new(LearningBondSignerLinkStatus.Invalid,
                Errors: new Dictionary<string, string> { ["authority"] = $"Confirm you have authority to accept this agreement for {link.Organization}." });
        }
        return LearningBondSignerOutcome<object>.Unknown;
    }

    private static LearningBondSignerOutcome<T> Closed<T>(LearningBondSignerLink link) =>
        link.Status == LearningBondSignerLinkStatus.Expired ? LearningBondSignerOutcome<T>.Expired(link.Organization!) : LearningBondSignerOutcome<T>.Unknown;
}
