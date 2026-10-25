using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Slips;

namespace PromiseHub.Application.Slips;

/// <summary>
/// Edits a sent slip (L2-014 criterion 3). A small change keeps every answer; a material change starts a new version,
/// supersedes the answers and asks every household to sign again.
/// </summary>
public sealed class EditSlipHandler(IPromiseHubDb db, IAuditWriter audit, SlipSender sender)
{
    public async Task<Result> HandleAsync(Guid slipId, EditSlipCommand command, CancellationToken cancellationToken = default)
    {
        var slip = await db.PermissionSlips.FirstOrDefaultAsync(s => s.Id == slipId, cancellationToken);
        var e = slip is null ? null : await sender.EventOfAsync(slip, cancellationToken);
        if (slip is null || e is null)
        {
            return Result.NotFound;
        }
        if (slip.Status != SlipStatus.Sent)
        {
            return Result.Conflict;
        }
        var title = command.Title?.Trim() ?? string.Empty;
        var body = command.Body?.Trim() ?? string.Empty;
        var errors = SlipSender.Validate(title, body, command.SignBy, await sender.EventDayAsync(e, cancellationToken));
        if (body.Length > PermissionSlip.MaxBodyLength)
        {
            errors["body"] = $"Keep it to {PermissionSlip.MaxBodyLength} characters.";
        }
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }
        slip.Edit(title, body, command.SignBy, command.Material);
        if (command.Material)
        {
            foreach (var signature in await db.SlipSignatures.Where(s => s.SlipId == slip.Id && s.Status != SignatureStatus.Superseded).ToListAsync(cancellationToken))
            {
                signature.Supersede();
            }
            await sender.SendAsync(slip, e, "edit", cancellationToken);
        }
        audit.Record(new AuditEvent(AuditAction.Updated, "PermissionSlip", slip.Id,
            command.Material ? $"{slip.Title} · material change, version {slip.Version}, signing re-opened" : $"{slip.Title} · edited"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
