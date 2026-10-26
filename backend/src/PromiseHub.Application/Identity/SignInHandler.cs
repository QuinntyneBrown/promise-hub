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
        var failures = await SignInLock.ConsecutiveFailuresAsync(db, email, now, cancellationToken);
        if (SignInLock.IsLocked(failures))
        {
            return new SignInResult(SignInStatus.Locked, LockedUntil: SignInLock.Until(failures));
        }

        var user = await db.StaffUsers.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
        var valid = user?.PasswordHash is { } hash && hasher.Verify(hash, command.Password);
        var membership = valid ? await ActiveMembership.ForAsync(db, email, cancellationToken) : null;
        db.SignInAttempts.Add(new SignInAttempt(Guid.NewGuid(), email, now, membership is not null));
        if (membership is null && valid)
        {
            // Told only after the right password, so it never reveals whether an email has an account (L2-050).
            await db.SaveChangesAsync(cancellationToken);
            return new SignInResult(SignInStatus.Deactivated);
        }
        if (membership is null)
        {
            if (failures.Count + 1 == SignInPolicy.MaxFailures)
            {
                await AuditLockAsync(email, cancellationToken);
            }
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

    /// <summary>The lock starts: recorded in every organization where the email has a current membership, none for an unknown email (L2-047).</summary>
    private async Task AuditLockAsync(string email, CancellationToken cancellationToken)
    {
        var memberships = await db.Memberships.IgnoreQueryFilters()
            .Where(m => m.Email == email && m.RemovedAt == null)
            .ToListAsync(cancellationToken);
        foreach (var membership in memberships)
        {
            tenant.Resolve(membership);
            audit.Record(new AuditEvent(AuditAction.SignInLocked, "StaffUser", null, $"Sign-in locked after {SignInPolicy.MaxFailures} failed attempts"));
            // Each organization's entry is saved while that organization is the tenant (ADR 0002).
            await db.SaveChangesAsync(cancellationToken);
        }
    }
}
