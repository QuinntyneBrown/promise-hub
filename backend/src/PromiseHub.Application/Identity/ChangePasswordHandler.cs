using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;

namespace PromiseHub.Application.Identity;

/// <summary>
/// Change password while signed in (L2-118, ADR 0072): the current password proves it is the person, the one policy applies with their
/// email (L2-053), every other session of theirs ends through the session version, and the change is audited in the active organization
/// only, without the password. The endpoint reissues this device's cookie so this session carries on.
/// </summary>
public sealed class ChangePasswordHandler(IPromiseHubDb db, ITenantContext tenant, IPasswordHasher hasher, IAuditWriter audit)
{
    public async Task<Result> ChangeAsync(Guid userId, ChangePasswordRequest request, CancellationToken cancellationToken = default)
    {
        var user = await db.StaffUsers.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user is null)
        {
            return Result.NotFound;
        }
        if (user.PasswordHash is null || !hasher.Verify(user.PasswordHash, request.Current ?? string.Empty))
        {
            return Result.Invalid(new Dictionary<string, string> { ["current"] = "That isn’t your current password." });
        }
        var errors = new Dictionary<string, string>();
        if (PasswordPolicy.Check(request.Password, user.Email) is { } problem)
        {
            errors["password"] = problem;
        }
        if (request.Repeat != request.Password)
        {
            errors["repeat"] = "The two passwords don’t match.";
        }
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }
        user.ChangePassword(hasher.Hash(request.Password!));
        user.EndOtherSessions();
        audit.Record(new AuditEvent(AuditAction.Updated, "StaffUser", user.Id, $"{tenant.ActorName} changed their password"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
