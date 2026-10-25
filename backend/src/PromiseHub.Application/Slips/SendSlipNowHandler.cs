using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Slips;

namespace PromiseHub.Application.Slips;

/// <summary>Sends a scheduled slip at once (dialog: send-now); any other state is a conflict.</summary>
public sealed class SendSlipNowHandler(IPromiseHubDb db, SlipSender sender)
{
    public async Task<Result> HandleAsync(Guid slipId, CancellationToken cancellationToken = default)
    {
        var slip = await db.PermissionSlips.FirstOrDefaultAsync(s => s.Id == slipId, cancellationToken);
        var e = slip is null ? null : await sender.EventOfAsync(slip, cancellationToken);
        if (slip is null || e is null)
        {
            return Result.NotFound;
        }
        if (slip.Status != SlipStatus.Scheduled)
        {
            return Result.Conflict;
        }
        await sender.SendAsync(slip, e, "send", cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
