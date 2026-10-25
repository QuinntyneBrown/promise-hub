using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Slips;

namespace PromiseHub.Application.Slips;

/// <summary>Sends a draft slip now, or schedules it when the time is in the future.</summary>
public sealed class SendSlipHandler(IPromiseHubDb db, SlipSender sender, TimeProvider clock)
{
    public async Task<Result> HandleAsync(Guid slipId, SendSlipCommand command, CancellationToken cancellationToken = default)
    {
        var slip = await db.PermissionSlips.FirstOrDefaultAsync(s => s.Id == slipId, cancellationToken);
        var e = slip is null ? null : await sender.EventOfAsync(slip, cancellationToken);
        if (slip is null || e is null)
        {
            return Result.NotFound;
        }
        if (slip.Status == SlipStatus.Sent)
        {
            return Result.Conflict;
        }
        var errors = SlipSender.Validate(slip.Title, slip.Body, slip.SignBy, await sender.EventDayAsync(e, cancellationToken));
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }
        if (command.At is { } at && at > clock.GetUtcNow())
        {
            slip.Schedule(at.ToUniversalTime());
        }
        else
        {
            await sender.SendAsync(slip, e, "send", cancellationToken);
        }
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
