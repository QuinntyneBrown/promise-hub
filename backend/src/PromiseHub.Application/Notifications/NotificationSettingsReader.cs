using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Messaging;
using PromiseHub.Domain.Notifications;

namespace PromiseHub.Application.Notifications;

/// <summary>The current organization's effective notification settings, for handlers and jobs.</summary>
public sealed class NotificationSettingsReader(IPromiseHubDb db)
{
    public async Task<TimeSpan> NoShowDelayAsync(CancellationToken cancellationToken) =>
        TimeSpan.FromMinutes((await db.NotificationSettings.AsNoTracking().FirstOrDefaultAsync(cancellationToken))?.NoShowDelayMinutes
            ?? NotificationSettings.DefaultNoShowDelayMinutes);

    public async Task<bool> EmailSupervisorsOnIncidentsAsync(CancellationToken cancellationToken) =>
        (await db.NotificationSettings.AsNoTracking().FirstOrDefaultAsync(cancellationToken))?.EmailSupervisorsOnIncidents ?? true;

    public async Task<int> SmsCapAsync(Domain.Organizations.Plan plan, CancellationToken cancellationToken) =>
        (await db.NotificationSettings.AsNoTracking().FirstOrDefaultAsync(cancellationToken))?.SmsCap ?? SmsUsagePeriod.CapFor(plan);
}
