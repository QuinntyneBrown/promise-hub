using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;

namespace PromiseHub.Application.Identity;

/// <summary>Finishes a sign-in that passed the password step by checking the six-digit code.</summary>
public sealed class CompleteMfaHandler(IPromiseHubDb db, ITotpVerifier totp, TenantContext tenant, IAuditWriter audit)
{
    public async Task<SignInResult> HandleAsync(Guid userId, string code, CancellationToken cancellationToken = default)
    {
        var user = await db.StaffUsers.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user?.MfaSecret is not { } secret || !totp.Verify(secret, code))
        {
            return SignInResult.Invalid;
        }
        var membership = await ActiveMembership.ForAsync(db, user.Email, cancellationToken);
        if (membership is null)
        {
            return SignInResult.Invalid;
        }

        tenant.Resolve(membership);
        audit.Record(new AuditEvent(AuditAction.SignedIn, "StaffUser", user.Id, "Signed in with a second factor"));
        await db.SaveChangesAsync(cancellationToken);
        return new SignInResult(SignInStatus.SignedIn, user.Id, membership.Id);
    }
}
