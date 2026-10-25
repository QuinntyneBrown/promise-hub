using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;

namespace PromiseHub.Application.Programs;

/// <summary>Archives a program once its name is typed: enrollment closes; roster, events and attendance are kept for reports (L2-012 criterion 3).</summary>
public sealed class ArchiveProgramHandler(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit, TimeProvider clock)
{
    public async Task<Result> HandleAsync(Guid id, string? confirmName, CancellationToken cancellationToken = default)
    {
        var program = await db.Programs.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (program is null)
        {
            return Result.NotFound;
        }
        if (!string.Equals(confirmName?.Trim(), program.Name, StringComparison.OrdinalIgnoreCase))
        {
            return Result.Invalid(new Dictionary<string, string> { ["confirmName"] = $"Type {program.Name} to confirm." });
        }
        program.Archive(tenant.ActorName, clock.GetUtcNow());
        audit.Record(new AuditEvent(AuditAction.Archived, "Program", program.Id, program.Name));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
