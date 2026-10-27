using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Mentoring;
using PromiseHub.Domain.Programs;

namespace PromiseHub.Application.Mentoring;

/// <summary>Assigns or removes the mentor of a youth on a cohort's active roster (L2-062 criteria 2, 3 and 9).</summary>
public sealed class AssignYouthMentorHandler(IPromiseHubDb db, ITenantContext tenant, ActiveMentors activeMentors, IAuditWriter audit, TimeProvider clock)
{
    public async Task<Result> AssignAsync(Guid programId, Guid childId, Guid? mentorId, CancellationToken cancellationToken = default)
    {
        var (refusal, childName) = await CheckAsync(programId, childId, cancellationToken);
        if (refusal is not null)
        {
            return refusal;
        }
        if (mentorId is not { } mentor)
        {
            return Invalid("Choose a mentor.");
        }
        if (!await activeMentors.AreActiveAsync([mentor], cancellationToken))
        {
            return Invalid("Choose an active mentor.");
        }
        var existing = await db.YouthMentors.FirstOrDefaultAsync(y => y.ChildId == childId, cancellationToken);
        var before = existing?.MentorMembershipId;
        if (existing is null)
        {
            existing = new YouthMentor(Guid.NewGuid(), tenant.OrganizationId, childId, mentor, clock.GetUtcNow());
            db.YouthMentors.Add(existing);
        }
        else
        {
            existing.Reassign(mentor, clock.GetUtcNow());
        }
        var mentorName = await db.Memberships.Where(m => m.Id == mentor).Select(m => m.PersonName).FirstAsync(cancellationToken);
        audit.Record(new AuditEvent(AuditAction.Updated, "YouthMentor", existing.Id, $"{childName} · {mentorName}",
            Before: before is null ? null : new { MentorId = before }, After: new { MentorId = mentor }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    public async Task<Result> RemoveAsync(Guid programId, Guid childId, CancellationToken cancellationToken = default)
    {
        var (refusal, childName) = await CheckAsync(programId, childId, cancellationToken);
        if (refusal is not null)
        {
            return refusal;
        }
        var existing = await db.YouthMentors.FirstOrDefaultAsync(y => y.ChildId == childId, cancellationToken);
        if (existing is null)
        {
            return Result.Done;
        }
        db.YouthMentors.Remove(existing);
        audit.Record(new AuditEvent(AuditAction.Deleted, "YouthMentor", existing.Id, childName!, Before: new { MentorId = existing.MentorMembershipId }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    private async Task<(Result? Refusal, string? ChildName)> CheckAsync(Guid programId, Guid childId, CancellationToken cancellationToken)
    {
        var program = await db.Programs.AsNoTracking().FirstOrDefaultAsync(p => p.Id == programId, cancellationToken);
        if (program is null)
        {
            return (Result.NotFound, null);
        }
        var child = await (
            from e in db.Enrollments.AsNoTracking()
            where e.ProgramId == programId && e.ChildId == childId && e.EndedAt == null
            join c in db.Children.AsNoTracking() on e.ChildId equals c.Id
            select c.FirstName + " " + c.LastName).FirstOrDefaultAsync(cancellationToken);
        if (child is null)
        {
            return (Result.NotFound, null);
        }
        if (program.Status == ProgramStatus.Archived)
        {
            return (Invalid($"{program.Name} is archived."), null);
        }
        return (null, child);
    }

    private static Result Invalid(string message) => Result.Invalid(new Dictionary<string, string> { ["mentorId"] = message });
}
