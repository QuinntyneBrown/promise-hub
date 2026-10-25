using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Application.Messaging;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Messaging;
using PromiseHub.Domain.Organizations;
using PromiseHub.Infrastructure.Persistence;

namespace PromiseHub.Infrastructure.Messaging;

/// <summary>
/// One pass of the send job: finds the organizations with queued deliveries and sends them, one organization at a time in
/// its own tenant scope, only while its Messages module is on (L2-001, L2-005, L2-034).
/// </summary>
public sealed class MessageDispatchRunner(IServiceScopeFactory scopes)
{
    public async Task RunOnceAsync(CancellationToken cancellationToken = default)
    {
        List<Guid> organizations;
        using (var scope = scopes.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PromiseHubDbContext>();
            organizations = await db.Deliveries.IgnoreQueryFilters().AsNoTracking()
                .Where(d => d.Status == DeliveryStatus.Queued)
                .Select(d => d.OrganizationId).Distinct().ToListAsync(cancellationToken);
        }
        foreach (var organizationId in organizations)
        {
            using var scope = scopes.CreateScope();
            scope.ServiceProvider.GetRequiredService<TenantContext>().ResolveForJob(organizationId);
            if (!await scope.ServiceProvider.GetRequiredService<IModuleGate>().IsOnAsync(ModuleId.Messages, cancellationToken))
            {
                continue;
            }
            await scope.ServiceProvider.GetRequiredService<SendQueuedDeliveriesHandler>().HandleAsync(cancellationToken);
        }
    }
}
