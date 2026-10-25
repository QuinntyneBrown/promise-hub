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
            organizations = [.. withDeliveries.Union(withSlips)];
        }
        foreach (var organizationId in organizations)
        {
            using var scope = scopes.CreateScope();
            scope.ServiceProvider.GetRequiredService<TenantContext>().ResolveForJob(organizationId);
            await scope.ServiceProvider.GetRequiredService<SendDueSlipsHandler>().HandleAsync(cancellationToken);
            await scope.ServiceProvider.GetRequiredService<SendQueuedDeliveriesHandler>().HandleAsync(cancellationToken);
        }
    }
}
