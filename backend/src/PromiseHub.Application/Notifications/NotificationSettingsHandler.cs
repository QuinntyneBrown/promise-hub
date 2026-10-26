using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Messaging;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Notifications;

namespace PromiseHub.Application.Notifications;

/// <summary>Reads and saves the organization's notification settings (`settings-notifications`). Saving is audited.</summary>
public sealed class NotificationSettingsHandler(IPromiseHubDb db, ITenantContext tenant, SmsCap sms, IAuditWriter audit)
{
    public async Task<NotificationSettingsDto> GetAsync(CancellationToken cancellationToken = default)
    {
        var current = await sms.CurrentAsync(cancellationToken);
        var row = await db.NotificationSettings.AsNoTracking().FirstOrDefaultAsync(cancellationToken);
        return new NotificationSettingsDto(
            row?.NoShowDelayMinutes ?? NotificationSettings.DefaultNoShowDelayMinutes,
            row?.EmailSupervisorsOnIncidents ?? true,
            current.Cap,
            current.Used);
    }

    public async Task<Result> SaveAsync(SaveNotificationSettingsCommand command, CancellationToken cancellationToken = default)
    {
        var current = await sms.CurrentAsync(cancellationToken);
        var errors = new Dictionary<string, string>();
        if (command.NoShowDelayMinutes is < NotificationSettings.MinNoShowDelayMinutes or > NotificationSettings.MaxNoShowDelayMinutes)
        {
            errors["noShowDelayMinutes"] = $"Choose between {NotificationSettings.MinNoShowDelayMinutes} and {NotificationSettings.MaxNoShowDelayMinutes} minutes.";
        }
        if (command.SmsCap < Math.Max(0, current.Used))
        {
            errors["smsCap"] = $"Can’t be below {current.Used:N0}, already used this month.";
        }
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }
        var row = await db.NotificationSettings.FirstOrDefaultAsync(cancellationToken);
        if (row is null)
        {
            row = new NotificationSettings(Guid.NewGuid(), tenant.OrganizationId);
            db.NotificationSettings.Add(row);
        }
        row.Change(command.NoShowDelayMinutes, command.EmailSupervisorsOnIncidents, command.SmsCap);
        current.ChangeCap(command.SmsCap);
        audit.Record(new AuditEvent(AuditAction.Updated, "NotificationSettings", row.Id,
            $"No-show after {command.NoShowDelayMinutes} min · supervisor emails {(command.EmailSupervisorsOnIncidents ? "on" : "off")} · SMS cap {command.SmsCap}"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
