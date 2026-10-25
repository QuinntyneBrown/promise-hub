using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Slips;

namespace PromiseHub.Application.Slips;

/// <summary>Texts the unsigned families now (dialog: send-reminder), each with their own children and links.</summary>
public sealed class RemindNowHandler(IPromiseHubDb db, SlipFamilies families, SlipReminderSender sender, IAuditWriter audit)
{
    public async Task<(Result Result, RemindNowResultDto? Value)> HandleAsync(Guid slipId, RemindNowCommand command, CancellationToken cancellationToken = default)
    {
        var slip = await db.PermissionSlips.FirstOrDefaultAsync(s => s.Id == slipId, cancellationToken);
        var e = slip is null ? null : await db.Events.AsNoTracking().FirstOrDefaultAsync(x => x.Id == slip.EventId, cancellationToken);
        if (slip is null || e is null)
        {
            return (Result.NotFound, null);
        }
        if (slip.Status != SlipStatus.Sent)
        {
            return (Result.Conflict, null);
        }
        var body = command.Body?.Trim() ?? string.Empty;
        if (!body.Contains("{link}", StringComparison.Ordinal))
        {
            return (Result.Invalid(new Dictionary<string, string> { ["body"] = "Keep {link} in the message." }), null);
        }
        var unsigned = await families.UnsignedAsync(slip, e, cancellationToken);
        var sent = await sender.RemindAsync(slip, e, unsigned, ReminderKind.Manual, $"manual:{Guid.NewGuid():N}",
            (f, link) => body.Replace("{child}", SlipReminderSender.Names(f), StringComparison.Ordinal).Replace("{link}", link, StringComparison.Ordinal),
            cancellationToken);
        audit.Record(new AuditEvent(AuditAction.Sent, "PermissionSlip", slip.Id, $"{slip.Title} · reminder to {sent} households"));
        await db.SaveChangesAsync(cancellationToken);
        return (Result.Done, new RemindNowResultDto(sent, unsigned.Count(f => !f.Reachable)));
    }
}
