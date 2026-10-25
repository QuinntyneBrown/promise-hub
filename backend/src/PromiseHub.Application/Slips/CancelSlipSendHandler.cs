using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Slips;

namespace PromiseHub.Application.Slips;

/// <summary>Cancels a scheduled send (dialog: cancel-send); the slip stays a draft and nothing is sent.</summary>
public sealed class CancelSlipSendHandler(IPromiseHubDb db, IAuditWriter audit)
{
    public async Task<Result> HandleAsync(Guid slipId, CancellationToken cancellationToken = default)
    {
        var slip = await db.PermissionSlips.FirstOrDefaultAsync(s => s.Id == slipId, cancellationToken);
        if (slip is null)
        {
            return Result.NotFound;
        }
        if (slip.Status != SlipStatus.Scheduled)
        {
            return Result.Conflict;
        }
        slip.CancelSchedule();
        audit.Record(new AuditEvent(AuditAction.Updated, "PermissionSlip", slip.Id, $"{slip.Title} · scheduled send cancelled"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
