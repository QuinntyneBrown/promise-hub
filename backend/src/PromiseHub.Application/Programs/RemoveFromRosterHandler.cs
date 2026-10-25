using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Domain.Audit;

namespace PromiseHub.Application.Programs;

/// <summary>Ends a child's enrollment; the row stays so attendance remains in reports.</summary>
public sealed class RemoveFromRosterHandler(IPromiseHubDb db, IAuditWriter audit, TimeProvider clock)
{
    public async Task<Result> HandleAsync(Guid programId, Guid childId, string? reason, CancellationToken cancellationToken = default)
    {
        var enrollment = await db.Enrollments.FirstOrDefaultAsync(e => e.ProgramId == programId && e.ChildId == childId && e.EndedAt == null, cancellationToken);
        if (enrollment is null)
        {
            return Result.NotFound;
        }
        enrollment.End(clock.GetUtcNow(), string.IsNullOrWhiteSpace(reason) ? "Removed" : reason.Trim());
        audit.Record(new AuditEvent(AuditAction.Deleted, "Enrollment", enrollment.Id, enrollment.EndReason!));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
