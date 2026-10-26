using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Identity;

namespace PromiseHub.Application.Identity;

/// <summary>
/// Ends one session on the server (L2-048): its id is recorded so a copy of the cookie is refused, ended sessions whose
/// cookie can no longer live are dropped, and the sign-out is audited in the session's organization.
/// </summary>
public sealed class SessionSignOutHandler(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit, TimeProvider clock)
{
    public async Task HandleAsync(Guid? sessionId, Guid userId, CancellationToken cancellationToken = default)
    {
        var now = clock.GetUtcNow();
        var expired = (await db.EndedSessions.ToListAsync(cancellationToken)).Where(s => s.ExpiresAt <= now);
        db.EndedSessions.RemoveRange(expired);
        if (sessionId is { } id && !await db.EndedSessions.AnyAsync(s => s.Id == id, cancellationToken))
        {
            db.EndedSessions.Add(new EndedSession(id, userId, now, now + SignInPolicy.IdleTimeout));
        }
        if (tenant.IsResolved)
        {
            audit.Record(new AuditEvent(AuditAction.SignedOut, "StaffUser", userId, "Signed out"));
        }
        await db.SaveChangesAsync(cancellationToken);
    }
}
