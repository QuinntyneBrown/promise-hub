using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Slips;

namespace PromiseHub.Application.Slips;

/// <summary>Saves a draft or scheduled slip; the text may still be empty while drafting (L2-014).</summary>
public sealed class SaveSlipHandler(IPromiseHubDb db, IAuditWriter audit)
{
    public async Task<Result> HandleAsync(Guid eventId, SaveSlipCommand command, CancellationToken cancellationToken = default)
    {
        var slip = await db.PermissionSlips.FirstOrDefaultAsync(s => s.EventId == eventId, cancellationToken);
        if (slip is null)
        {
            return Result.NotFound;
        }
        if (slip.Status == SlipStatus.Sent)
        {
            return Result.Conflict;
        }
        var body = command.Body?.Trim() ?? string.Empty;
        if (body.Length > PermissionSlip.MaxBodyLength)
        {
            return Result.Invalid(new Dictionary<string, string> { ["body"] = $"Keep it to {PermissionSlip.MaxBodyLength} characters." });
        }
        slip.Write(command.Title?.Trim() ?? string.Empty, body, command.SignBy, command.AskPhotos, command.AskSwimming, command.AskLunch,
            command.Reminders, command.Channel);
        audit.Record(new AuditEvent(AuditAction.Updated, "PermissionSlip", slip.Id, $"{slip.Title} · draft saved"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
