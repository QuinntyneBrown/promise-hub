using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Organizations;
using PromiseHub.Domain.Slips;

namespace PromiseHub.Application.Slips;

/// <summary>Part of the per-tenant send job: sends the scheduled slips whose time has come, while Permission slips is on.</summary>
public sealed class SendDueSlipsHandler(IPromiseHubDb db, IModuleGate modules, SlipSender sender, TimeProvider clock)
{
    public async Task HandleAsync(CancellationToken cancellationToken = default)
    {
        if (!await modules.IsOnAsync(ModuleId.Slips, cancellationToken))
        {
            return;
        }
        var now = clock.GetUtcNow();
        var due = (await db.PermissionSlips.Where(s => s.Status == SlipStatus.Scheduled).ToListAsync(cancellationToken))
            .Where(s => s.ScheduledFor <= now).ToList();
        foreach (var slip in due)
        {
            if (await sender.EventOfAsync(slip, cancellationToken) is { } e)
            {
                await sender.SendAsync(slip, e, "send", cancellationToken);
            }
        }
        await db.SaveChangesAsync(cancellationToken);
    }
}
