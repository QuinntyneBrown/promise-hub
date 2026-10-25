using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Identity;

namespace PromiseHub.Application.Identity;

/// <summary>Checks a password, applies the lockout and decides whether a second factor is needed.</summary>
public sealed class SignInHandler(IPromiseHubDb db, IPasswordHasher hasher, TimeProvider clock, TenantContext tenant, IAuditWriter audit)
{
    public async Task<SignInResult> HandleAsync(SignInCommand command, CancellationToken cancellationToken = default)
    {
        var email = SignInPolicy.Normalize(command.Email);
        var now = clock.GetUtcNow();
        var since = now - SignInPolicy.Window;
        var failures = (await db.SignInAttempts
            .Where(a => a.Email == email && !a.Succeeded)
            .Select(a => a.At)
            .ToListAsync(cancellationToken))
            .Where(at => at > since)
            .ToList();
        if (failures.Count >= SignInPolicy.MaxFailures)
        {
            return new SignInResult(SignInStatus.Locked, LockedUntil: failures.Max() + SignInPolicy.Window);
        }

        var user = await db.StaffUsers.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
        var valid = user?.PasswordHash is { } hash && hasher.Verify(hash, command.Password);
        var membership = valid ? await ActiveMembership.ForAsync(db, email, cancellationToken) : null;
        db.SignInAttempts.Add(new SignInAttempt(Guid.NewGuid(), email, now, membership is not null));
        if (membership is null)
        {
            await db.SaveChangesAsync(cancellationToken);
            return SignInResult.Invalid;
        }
        if (SignInPolicy.RequiresMfa(membership.Role) && user!.MfaSecret is not null)
        {
            await db.SaveChangesAsync(cancellationToken);
            return new SignInResult(SignInStatus.MfaRequired, user.Id);
        }

        tenant.Resolve(membership);
        audit.Record(new AuditEvent(AuditAction.SignedIn, "StaffUser", user!.Id, "Signed in"));
        await db.SaveChangesAsync(cancellationToken);
        return new SignInResult(SignInStatus.SignedIn, user.Id, membership.Id);
    }
}
