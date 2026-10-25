using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Guardian;

namespace PromiseHub.Application.Guardian;

/// <summary>
/// Checks a code: three wrong codes lock the link for 15 minutes (L2-026 criterion 2); a right one trusts this device for
/// the household for 30 days and returns the device token for an HttpOnly cookie (criterion 3).
/// </summary>
public sealed class VerifyGuardianCodeHandler(IPromiseHubDb db, GuardianAccess access, IAuditWriter audit, TimeProvider clock)
{
    public static readonly TimeSpan DeviceLifetime = TimeSpan.FromDays(30);

    public async Task<GuardianResult> HandleAsync(GuardianVerifyRequest request, CancellationToken cancellationToken = default)
    {
        var scope = await access.ResolveAsync(new GuardianRequest(request.Token, null, null), cancellationToken);
        if (scope is null)
        {
            return GuardianResult.Of(GuardianOutcome.Gone, GuardianAccess.GoneBody(null));
        }
        var now = clock.GetUtcNow();
        var link = await db.GuardianLinks.SingleAsync(l => l.Id == scope.Link.Id, cancellationToken);
        if (link.IsLocked(now))
        {
            return GuardianResult.Of(GuardianOutcome.Locked);
        }
        var hash = GuardianTokens.Hash($"{link.Id}:{request.Code?.Trim()}");
        var verification = (await db.GuardianVerifications.Where(v => v.LinkId == link.Id && v.UsedAt == null).ToListAsync(cancellationToken))
            .FirstOrDefault(v => v.CodeHash == hash && v.ExpiresAt > now);
        if (verification is null)
        {
            if (link.WrongCode(now))
            {
                audit.Record(new AuditEvent(AuditAction.AccessDenied, "GuardianLink", link.Id, "Three wrong codes: link locked for 15 minutes"));
            }
            await db.SaveChangesAsync(cancellationToken);
            return GuardianResult.Invalid("code", "That code didn’t work. Check the latest text or email.");
        }
        verification.Use(now);
        link.Verified();
        var device = GuardianTokens.New();
        db.TrustedGuardianDevices.Add(new TrustedGuardianDevice(Guid.NewGuid(), link.OrganizationId, link.HouseholdId, GuardianTokens.Hash(device), now.Add(DeviceLifetime)));
        audit.Record(new AuditEvent(AuditAction.Updated, "GuardianLink", link.Id, "Device verified for 30 days"));
        await db.SaveChangesAsync(cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Done, device);
    }
}
