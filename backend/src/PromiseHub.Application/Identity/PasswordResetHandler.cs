using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Messaging;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Identity;

namespace PromiseHub.Application.Identity;

/// <summary>
/// Recovering access (L2-044): ask for a link by email (the answer never reveals whether the address exists), check the
/// link, and set a new password that meets the password policy (L2-053). Resetting uses the link up, signs out other devices, is
/// audited and signs the person in, through two-step sign-in where their role needs it.
/// </summary>
public sealed class PasswordResetHandler(IPromiseHubDb db, TenantContext tenant, IPasswordHasher hasher, IEmailSender email,
    GuardianLinkOptions links, IAuditWriter audit, TimeProvider clock)
{
    public async Task RequestAsync(ForgotPasswordCommand command, CancellationToken cancellationToken = default)
    {
        var address = SignInPolicy.Normalize(command.Email ?? string.Empty);
        var user = address.Length == 0 ? null : await db.StaffUsers.FirstOrDefaultAsync(u => u.Email == address, cancellationToken);
        if (user is null || await ActiveMembership.ForAsync(db, address, cancellationToken) is null)
        {
            return;
        }
        var token = GuardianTokens.New();
        db.PasswordResets.Add(new PasswordReset(Guid.NewGuid(), user.Id, GuardianTokens.Hash(token), clock.GetUtcNow()));
        await db.SaveChangesAsync(cancellationToken);
        await email.SendAsync(user.Email, "Reset your PromiseHub password",
            $"Choose a new password within an hour: {links.BaseUrl.TrimEnd('/')}/reset-password?token={token}\nIf you didn't ask, ignore this email; your password hasn't changed.", cancellationToken);
    }

    /// <summary>The email the link is for, or null when it can't be used.</summary>
    public async Task<string?> CheckAsync(string token, CancellationToken cancellationToken = default)
    {
        var reset = await FindAsync(token, cancellationToken);
        return reset is null ? null : (await db.StaffUsers.AsNoTracking().SingleAsync(u => u.Id == reset.UserId, cancellationToken)).Email;
    }

    public async Task<ResetPasswordResult> ResetAsync(ResetPasswordCommand command, CancellationToken cancellationToken = default)
    {
        var reset = await FindAsync(command.Token ?? string.Empty, cancellationToken);
        if (reset is null)
        {
            return new ResetPasswordResult(true, null, null);
        }
        var errors = new Dictionary<string, string>();
        var user = await db.StaffUsers.SingleAsync(u => u.Id == reset.UserId, cancellationToken);
        if (PasswordPolicy.Check(command.Password, user.Email) is { } weak)
        {
            errors["password"] = weak;
        }
        if (command.Repeat != command.Password)
        {
            errors["repeat"] = "The two passwords don’t match.";
        }
        if (errors.Count > 0)
        {
            return new ResetPasswordResult(false, errors, null);
        }
        var membership = await ActiveMembership.ForAsync(db, user.Email, cancellationToken);
        if (membership is null)
        {
            return new ResetPasswordResult(true, null, null);
        }
        var now = clock.GetUtcNow();
        var locked = SignInLock.IsLocked(await SignInLock.ConsecutiveFailuresAsync(db, user.Email, now, cancellationToken));
        user.ChangePassword(hasher.Hash(command.Password!));
        user.EndOtherSessions();
        reset.Use(now);
        tenant.Resolve(membership);
        audit.Record(new AuditEvent(AuditAction.Updated, "StaffUser", user.Id, "Reset password by emailed link"));
        // The reset is a successful sign-in: it ends a lock, and the count starts again (L2-047).
        db.SignInAttempts.Add(new SignInAttempt(Guid.NewGuid(), user.Email, now, true));
        if (locked)
        {
            audit.Record(new AuditEvent(AuditAction.SignInUnlocked, "StaffUser", user.Id, "Unlocked sign-in by password reset"));
        }
        await db.SaveChangesAsync(cancellationToken);
        return new ResetPasswordResult(false, null, SignInPolicy.RequiresMfa(membership.Role) && user.MfaSecret is not null
            ? new SignInResult(SignInStatus.MfaRequired, user.Id)
            : new SignInResult(SignInStatus.SignedIn, user.Id, membership.Id));
    }

    private async Task<PasswordReset?> FindAsync(string token, CancellationToken cancellationToken)
    {
        if (token.Length == 0)
        {
            return null;
        }
        var hash = GuardianTokens.Hash(token);
        var reset = await db.PasswordResets.FirstOrDefaultAsync(r => r.TokenHash == hash, cancellationToken);
        return reset is not null && reset.Usable(clock.GetUtcNow()) ? reset : null;
    }
}
