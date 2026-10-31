using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Messaging;
using PromiseHub.Application.Notifications;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.LearningBond;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// The named signer's own page behind the emailed link (L2-137, ADR 0078): anonymous, outside the Learning Bond module gate because the
/// agreement is accepted before the module can be on. It reads the agreement and the request only, never a household.
/// </summary>
public sealed class LearningBondSignerLinkHandler(IPromiseHubDb db, LearningBondSignerLinkAccess access, NotificationWriter notifications, IEmailSender email,
    IAuditWriter audit, TimeProvider clock)
{
    public const string NoticeKind = "agreement";
    public const string NoticeLink = "/settings/learning-bond/agreement";

    public async Task<LearningBondSignerOutcome<LearningBondSignerAgreementDto>> GetAsync(string token, CancellationToken cancellationToken = default)
    {
        var link = await access.ResolveAsync(token, cancellationToken);
        if (link is not { Status: LearningBondSignerLinkStatus.Open, Request: { } request })
        {
            return Closed<LearningBondSignerAgreementDto>(link);
        }
        var agreement = await CurrentAsync(cancellationToken);
        return new(LearningBondSignerLinkStatus.Open, new LearningBondSignerAgreementDto(link.Organization!, request.RequestedByName, request.Name, request.Title,
            agreement.Version, agreement.EffectiveOn,
            [new("What we collect", agreement.WhatWeCollect), new("Where it goes", agreement.WhereItGoes), new("What your organization sees", agreement.WhatYourOrganizationSees)]));
    }

    /// <summary>
    /// Records the acceptance with the signer's name, title and email, closes the link, and tells the admin who asked in the app and by
    /// email (L2-137 criterion 2). Without the authority box nothing is stored and the link still works (criterion 8).
    /// </summary>
    public async Task<LearningBondSignerOutcome<LearningBondSignerAcceptanceDto>> AcceptAsync(string token, AcceptAgreementRequest request,
        CancellationToken cancellationToken = default)
    {
        var link = await access.ResolveAsync(token, cancellationToken);
        if (link is not { Status: LearningBondSignerLinkStatus.Open, Request: { } signer })
        {
            return Closed<LearningBondSignerAcceptanceDto>(link);
        }
        var organization = link.Organization!;
        if (!request.Authority)
        {
            return new(LearningBondSignerLinkStatus.Invalid,
                Errors: new Dictionary<string, string> { ["authority"] = $"Confirm you have authority to accept this agreement for {organization}." });
        }
        var agreement = await CurrentAsync(cancellationToken);
        var now = clock.GetUtcNow();
        var acceptance = LearningBondAgreementAcceptance.BySigner(Guid.NewGuid(), signer, agreement.Version, now);
        db.LearningBondAgreementAcceptances.Add(acceptance);
        signer.Use(now);
        audit.Record(new AuditEvent(AuditAction.Created, nameof(LearningBondAgreementAcceptance), acceptance.Id,
            $"Learning Bond data-handling agreement version {agreement.Version} accepted by {signer.Name}, {signer.Title}", After: new { AgreementVersion = agreement.Version }));
        var notice = $"{signer.Name}, {signer.Title}, accepted the Learning Bond data-handling agreement version {agreement.Version}.";
        await notifications.NotifyMembersAsync([signer.RequestedByMembershipId], NoticeKind, notice, NoticeLink, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        if (await db.Memberships.AsNoTracking().Where(m => m.Id == signer.RequestedByMembershipId && m.RemovedAt == null).Select(m => m.Email)
                .FirstOrDefaultAsync(cancellationToken) is { } admin)
        {
            await email.SendAsync(admin, $"{signer.Name} accepted the Learning Bond agreement",
                $"{signer.Name}, {signer.Title}, accepted version {agreement.Version} of the Learning Bond data-handling agreement for {organization}. "
                + "It’s recorded in your audit log. You can now choose coverage and plan the launch.\n\nPromiseHub for " + organization, cancellationToken);
        }
        return new(LearningBondSignerLinkStatus.Open,
            new LearningBondSignerAcceptanceDto(organization, signer.RequestedByName, signer.Name, signer.Title, signer.Email, agreement.Version, now));
    }

    private async Task<LearningBondAgreement> CurrentAsync(CancellationToken cancellationToken) =>
        await db.LearningBondAgreements.AsNoTracking().OrderByDescending(a => a.Version).FirstAsync(cancellationToken);

    private static LearningBondSignerOutcome<T> Closed<T>(LearningBondSignerLink link) =>
        link.Status == LearningBondSignerLinkStatus.Expired ? LearningBondSignerOutcome<T>.Expired(link.Organization!) : LearningBondSignerOutcome<T>.Unknown;
}
