using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Messaging;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Guardian;
using PromiseHub.Domain.Households;

namespace PromiseHub.Application.Guardian;

/// <summary>
/// Issues and delivers a child's consent link (L2-056 criterion 3, ADR 0046): one link for the household, texted to each guardian
/// who may sign and has a mobile, or emailed when they have only a working email, in the household language, straight to the
/// provider. Earlier consent links of the child stop working. A second request within 10 minutes sends nothing more.
/// </summary>
public sealed class ConsentRequestSender(IPromiseHubDb db, ConsentGate gate, GuardianLinkIssuer issuer, ISmsSender sms, IEmailSender email, IAuditWriter audit, TimeProvider clock)
{
    public static readonly TimeSpan Quiet = TimeSpan.FromMinutes(10);

    public async Task<ConsentRequestResult> SendAsync(Child child, string askedBy, CancellationToken cancellationToken = default)
    {
        if (!(await gate.StatusAsync(child.Id, cancellationToken)).Gated)
        {
            return new ConsentRequestResult(ConsentRequestOutcome.NotNeeded, []);
        }
        var signers = (await db.Guardians.AsNoTracking().Where(g => g.HouseholdId == child.HouseholdId && g.CanSign).ToListAsync(cancellationToken))
            .Where(g => g.Reachable).OrderByDescending(g => g.IsPrimary).ThenBy(g => g.Name).ToList();
        if (signers.Count == 0)
        {
            return new ConsentRequestResult(ConsentRequestOutcome.NoGuardian, []);
        }
        var sentTo = signers.Select(g => g.Mobile is { Length: > 0 } mobile ? ContactMask.Phone(mobile) : ContactMask.Email(g.Email!)).ToList();
        var now = clock.GetUtcNow();
        var links = await db.GuardianLinks.Where(l => l.ChildId == child.Id && l.ForConsent && l.RevokedAt == null).ToListAsync(cancellationToken);
        if (links.Any(l => now - l.CreatedAt < Quiet))
        {
            return new ConsentRequestResult(ConsentRequestOutcome.Sent, sentTo);
        }
        foreach (var link in links)
        {
            link.Revoke(now);
        }
        var household = await db.Households.AsNoTracking().SingleAsync(h => h.Id == child.HouseholdId, cancellationToken);
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == household.OrganizationId, cancellationToken);
        var url = issuer.IssueConsent(household.Id, child.Id);
        var text = ConsentTexts.Link(household.Language, organization.Name, child.FirstName, url);
        foreach (var guardian in signers)
        {
            if (guardian.Mobile is { Length: > 0 } mobile)
            {
                await sms.SendAsync(mobile, text, cancellationToken);
            }
            else
            {
                await email.SendAsync(guardian.Email!, ConsentTexts.CopySubject(household.Language, child.FirstName), text, cancellationToken);
            }
        }
        audit.Record(new AuditEvent(AuditAction.Sent, "GuardianConsent", child.Id,
            $"{child.FullName} · consent link sent to {string.Join(", ", signers.Select(g => g.Name))} · asked by {askedBy}"));
        await db.SaveChangesAsync(cancellationToken);
        return new ConsentRequestResult(ConsentRequestOutcome.Sent, sentTo);
    }
}
