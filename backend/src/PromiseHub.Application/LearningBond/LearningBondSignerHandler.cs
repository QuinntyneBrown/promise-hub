using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Messaging;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.LearningBond;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// The admin side of a named signer (L2-137): ask by name, title and email, resend and cancel. One request is open per organization; the
/// link is single-use, works for 14 days and is stored only as its hash. The signer's own page behind the link is prompt 84.
/// </summary>
public sealed class LearningBondSignerHandler(IPromiseHubDb db, ITenantContext tenant, IEmailSender email, GuardianLinkOptions links, IAuditWriter audit, TimeProvider clock)
{
    public const string NameMessage = "Enter the signer’s name.";
    public const string TitleMessage = "Enter the signer’s role or title.";
    public const string EmailMessage = "Enter an email like name@example.org.";

    /// <summary>The tenant's open request, if any.</summary>
    public async Task<LearningBondSignerRequest?> OpenAsync(CancellationToken cancellationToken = default)
    {
        var now = clock.GetUtcNow();
        var requests = await db.LearningBondSignerRequests.Where(r => r.CancelledAt == null && r.UsedAt == null).ToListAsync(cancellationToken);
        return requests.Where(r => r.IsOpen(now)).OrderByDescending(r => r.SentAt).FirstOrDefault();
    }

    public async Task<Result> RequestAsync(RequestSignerRequest request, CancellationToken cancellationToken = default)
    {
        var name = request.Name?.Trim() ?? string.Empty;
        var title = request.Title?.Trim() ?? string.Empty;
        var address = request.Email?.Trim() ?? string.Empty;
        var errors = new Dictionary<string, string>();
        if (name.Length is 0 or > LearningBondSignerRequest.MaximumText)
        {
            errors["name"] = NameMessage;
        }
        if (title.Length is 0 or > LearningBondSignerRequest.MaximumText)
        {
            errors["title"] = TitleMessage;
        }
        if (!EmailAddressRule.IsValid(address))
        {
            errors["email"] = EmailMessage;
        }
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }
        var now = clock.GetUtcNow();
        // One open request per organization: a new one replaces it and cancels its link (criterion 5).
        if (await OpenAsync(cancellationToken) is { } earlier)
        {
            earlier.Cancel(now);
        }
        var token = GuardianTokens.New();
        var signer = new LearningBondSignerRequest(Guid.NewGuid(), tenant.OrganizationId, name, title, address, GuardianTokens.Hash(token),
            tenant.MembershipId, tenant.ActorName, now);
        db.LearningBondSignerRequests.Add(signer);
        audit.Record(new AuditEvent(AuditAction.Created, nameof(LearningBondSignerRequest), signer.Id, $"Learning Bond agreement signer requested: {name}, {title}"));
        await db.SaveChangesAsync(cancellationToken);
        await SendAsync(signer, token, cancellationToken);
        return Result.Created(signer.Id);
    }

    /// <summary>A new link to the same signer; the earlier one stops working (criterion 6, ADR 0077). 404 unless it is the tenant's open request.</summary>
    public async Task<Result> ResendAsync(Guid id, CancellationToken cancellationToken = default)
    {
        if (await OpenAsync(cancellationToken) is not { } signer || signer.Id != id)
        {
            return Result.NotFound;
        }
        var token = GuardianTokens.New();
        signer.Resend(GuardianTokens.Hash(token), clock.GetUtcNow());
        audit.Record(new AuditEvent(AuditAction.Updated, nameof(LearningBondSignerRequest), signer.Id, $"Learning Bond agreement signer link resent to {signer.Name}"));
        await db.SaveChangesAsync(cancellationToken);
        await SendAsync(signer, token, cancellationToken);
        return Result.Done;
    }

    public async Task<Result> CancelAsync(Guid id, CancellationToken cancellationToken = default)
    {
        if (await OpenAsync(cancellationToken) is not { } signer || signer.Id != id)
        {
            return Result.NotFound;
        }
        signer.Cancel(clock.GetUtcNow());
        audit.Record(new AuditEvent(AuditAction.Updated, nameof(LearningBondSignerRequest), signer.Id, $"Learning Bond agreement signer request for {signer.Name} cancelled"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    // From "{organization} via PromiseHub" (criterion 1); the link is the only copy of the token.
    private async Task SendAsync(LearningBondSignerRequest signer, string token, CancellationToken cancellationToken)
    {
        var organization = await db.Organizations.AsNoTracking().Where(o => o.Id == tenant.OrganizationId).Select(o => o.Name).SingleAsync(cancellationToken);
        var link = $"{links.BaseUrl.TrimEnd('/')}/sign/learning-bond/{token}";
        await email.SendAsync(signer.Email, $"{organization} via PromiseHub: please accept the Learning Bond data-handling agreement",
            $"{signer.RequestedByName} asked you, as {signer.Title}, to accept the Learning Bond data-handling agreement for {organization}. "
            + $"No PromiseHub account is needed. The link works once, for 14 days: {link}\n\n{organization} via PromiseHub", cancellationToken);
    }
}
