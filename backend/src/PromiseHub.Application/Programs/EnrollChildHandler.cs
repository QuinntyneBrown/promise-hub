using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Programs;

namespace PromiseHub.Application.Programs;

/// <summary>Adds a child of the organization to an active program's roster while there is room.</summary>
public sealed class EnrollChildHandler(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit, TimeProvider clock, Billing.PlanLimit limit)
{
    public async Task<Result> HandleAsync(Guid programId, Guid childId, CancellationToken cancellationToken = default)
    {
        var program = await db.Programs.FirstOrDefaultAsync(p => p.Id == programId, cancellationToken);
        if (program is null)
        {
            return Result.NotFound;
        }
        var child = await db.Children.FirstOrDefaultAsync(c => c.Id == childId, cancellationToken);
        if (child is null)
        {
            return Result.Invalid(new Dictionary<string, string> { ["childId"] = "Choose a child from your roster." });
        }
        if (program.Status == ProgramStatus.Archived)
        {
            return Result.Invalid(new Dictionary<string, string> { ["childId"] = $"{program.Name} is archived." });
        }
        var active = await db.Enrollments.Where(e => e.ProgramId == programId && e.EndedAt == null).Select(e => e.ChildId).ToListAsync(cancellationToken);
        if (active.Contains(childId))
        {
            return Result.Invalid(new Dictionary<string, string> { ["childId"] = $"{child.FullName} is already enrolled." });
        }
        if (active.Count >= program.Capacity)
        {
            return Result.Invalid(new Dictionary<string, string> { ["childId"] = $"{program.Name} is full ({active.Count} of {program.Capacity})." });
        }
        if (await limit.RefusalForAsync([childId], cancellationToken) is { } refusal)
        {
            return Result.Invalid(new Dictionary<string, string> { ["childId"] = refusal });
        }
        var enrollment = new Domain.Programs.Enrollment(Guid.NewGuid(), tenant.OrganizationId, programId, childId, clock.GetUtcNow());
        db.Enrollments.Add(enrollment);
        audit.Record(new AuditEvent(AuditAction.Created, "Enrollment", enrollment.Id, $"{child.FullName} · {program.Name}"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Created(enrollment.Id);
    }
}
