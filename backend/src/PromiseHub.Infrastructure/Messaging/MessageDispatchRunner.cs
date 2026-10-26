using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Application.Messaging;
using PromiseHub.Application.Organizations;
using PromiseHub.Application.Slips;
using PromiseHub.Domain.Messaging;
using PromiseHub.Domain.Slips;
using PromiseHub.Infrastructure.Persistence;

namespace PromiseHub.Infrastructure.Messaging;

/// <summary>
/// One pass of the send job: finds the organizations with scheduled slips due or queued deliveries and handles them one
/// organization at a time in its own tenant scope, sending only what belongs to modules that are on (L2-001, L2-005, L2-034).
/// </summary>
public sealed class MessageDispatchRunner(IServiceScopeFactory scopes, TimeProvider clock)
{
    public async Task RunOnceAsync(CancellationToken cancellationToken = default)
    {
        var now = clock.GetUtcNow();
        List<Guid> organizations;
        using (var scope = scopes.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PromiseHubDbContext>();
            var withDeliveries = await db.Deliveries.IgnoreQueryFilters().AsNoTracking()
                .Where(d => d.Status == DeliveryStatus.Queued)
                .Select(d => d.OrganizationId).Distinct().ToListAsync(cancellationToken);
            var withSlips = (await db.PermissionSlips.IgnoreQueryFilters().AsNoTracking()
                .Where(s => s.Status == SlipStatus.Scheduled)
                .Select(s => new { s.OrganizationId, s.ScheduledFor }).ToListAsync(cancellationToken))
                .Where(s => s.ScheduledFor <= now).Select(s => s.OrganizationId);
            // Sent slips with a schedule may have a reminder slot due; the handler decides per slot.
            var withReminders = await db.PermissionSlips.IgnoreQueryFilters().AsNoTracking()
                .Where(s => s.Status == SlipStatus.Sent && s.Reminders != SlipReminders.None)
                .Select(s => s.OrganizationId).Distinct().ToListAsync(cancellationToken);
            // Sessions past the no-show delay that haven't ended may have children to alert; the handler decides per child.
            var withSessions = (await db.Events.IgnoreQueryFilters().AsNoTracking()
                .Where(e => e.NoShowAlert && e.Status != Domain.Events.EventStatus.Cancelled)
                .Select(e => new { e.OrganizationId, e.StartsAt, e.EndsAt }).ToListAsync(cancellationToken))
                .Where(e => e.StartsAt + Application.Attendance.NoShowRules.MinDelay <= now && e.EndsAt > now).Select(e => e.OrganizationId);
            organizations = [.. withDeliveries.Union(withSlips).Union(withReminders).Union(withSessions)];
        }
        foreach (var organizationId in organizations)
        {
            using var scope = scopes.CreateScope();
            scope.ServiceProvider.GetRequiredService<TenantContext>().ResolveForJob(organizationId);
            await scope.ServiceProvider.GetRequiredService<SendDueSlipsHandler>().HandleAsync(cancellationToken);
            await scope.ServiceProvider.GetRequiredService<SendDueRemindersHandler>().HandleAsync(cancellationToken);
            await scope.ServiceProvider.GetRequiredService<Application.Attendance.SendNoShowAlertsHandler>().HandleAsync(cancellationToken);
            await scope.ServiceProvider.GetRequiredService<SendQueuedDeliveriesHandler>().HandleAsync(cancellationToken);
        }
    }
}
