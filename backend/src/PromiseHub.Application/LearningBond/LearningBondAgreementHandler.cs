using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.LearningBond;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// Reads and accepts the data-handling agreement for the signed-in membership's organization (L2-136, ADR 0076, ADR 0077). Served while
/// Learning Bond is off, since the module cannot turn on before an acceptance; it reads no household, child or guardian (criterion 5).
/// </summary>
public sealed class LearningBondAgreementHandler(IPromiseHubDb db, ITenantContext tenant, IModuleGate modules, LearningBondSignerHandler signers, IAuditWriter audit, TimeProvider clock)
{
    public const string AuthorityMessage = "Confirm you have authority to accept this agreement, or ask someone else to sign.";

    public async Task<LearningBondAgreementDto> GetAsync(CancellationToken cancellationToken = default)
    {
        var agreement = await CurrentAsync(cancellationToken);
        var acceptances = await db.LearningBondAgreementAcceptances.AsNoTracking().OrderByDescending(a => a.AgreementVersion).ThenByDescending(a => a.AcceptedAt)
            .ToListAsync(cancellationToken);
        var current = acceptances.FirstOrDefault(a => a.AgreementVersion == agreement.Version);
        var earlier = current is null ? acceptances.FirstOrDefault(a => a.AgreementVersion < agreement.Version) : null;
        return new LearningBondAgreementDto(agreement.Version, agreement.EffectiveOn,
            [new("What we collect", agreement.WhatWeCollect), new("Where it goes", agreement.WhereItGoes), new("What your organization sees", agreement.WhatYourOrganizationSees)],
            Dto(current), Dto(earlier), SignerDto(await signers.OpenAsync(cancellationToken)), await modules.IsOnAsync(ModuleId.LearningBond, cancellationToken));
    }

    public async Task<Result> AcceptAsync(AcceptAgreementRequest request, CancellationToken cancellationToken = default)
    {
        if (!request.Authority)
        {
            return Result.Invalid(new Dictionary<string, string> { ["authority"] = AuthorityMessage });
        }
        var agreement = await CurrentAsync(cancellationToken);
        if (await db.LearningBondAgreementAcceptances.FirstOrDefaultAsync(a => a.AgreementVersion == agreement.Version, cancellationToken) is { } existing)
        {
            return Result.Created(existing.Id);
        }
        var acceptance = new LearningBondAgreementAcceptance(Guid.NewGuid(), tenant.OrganizationId, agreement.Version, tenant.MembershipId, tenant.ActorName, clock.GetUtcNow());
        db.LearningBondAgreementAcceptances.Add(acceptance);
        // Accepting closes a request still waiting for a named signer; the link stops working.
        (await signers.OpenAsync(cancellationToken))?.Cancel(acceptance.AcceptedAt);
        audit.Record(new AuditEvent(AuditAction.Created, nameof(LearningBondAgreementAcceptance), acceptance.Id,
            $"Learning Bond data-handling agreement version {agreement.Version} accepted", After: new { AgreementVersion = agreement.Version }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Created(acceptance.Id);
    }

    private async Task<LearningBondAgreement> CurrentAsync(CancellationToken cancellationToken) =>
        await db.LearningBondAgreements.AsNoTracking().OrderByDescending(a => a.Version).FirstAsync(cancellationToken);

    private static LearningBondSignerRequestDto? SignerDto(LearningBondSignerRequest? r) =>
        r is null ? null : new(r.Id, r.Name, r.Title, r.Email, r.SentAt, r.ExpiresAt);

    private static LearningBondAcceptanceDto? Dto(LearningBondAgreementAcceptance? a) => a is null ? null : new(a.AgreementVersion, a.AcceptedByName, a.AcceptedAt);
}
