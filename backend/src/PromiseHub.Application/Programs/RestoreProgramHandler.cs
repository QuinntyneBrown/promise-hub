using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Domain.Audit;

namespace PromiseHub.Application.Programs;

public sealed class RestoreProgramHandler(IPromiseHubDb db, IAuditWriter audit)
{
    public async Task<Result> HandleAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var program = await db.Programs.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (program is null)
        {
            return Result.NotFound;
        }
        program.Restore();
        audit.Record(new AuditEvent(AuditAction.Restored, "Program", program.Id, program.Name));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
