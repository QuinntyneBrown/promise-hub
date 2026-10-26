using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Application.Organizations;
using PromiseHub.Infrastructure.Persistence;

namespace PromiseHub.Infrastructure.Privacy;

/// <summary>The retention job: for each organization in its own scope and tenant, applies its consent retention (L2-030, L2-034).</summary>
public sealed class RetentionRunner(IServiceScopeFactory scopes)
{
    public async Task RunOnceAsync(CancellationToken cancellationToken = default)
    {
        List<Guid> organizations;
        using (var scope = scopes.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PromiseHubDbContext>();
            organizations = await db.Organizations.AsNoTracking().Select(o => o.Id).ToListAsync(cancellationToken);
        }
        foreach (var organizationId in organizations)
        {
            using var scope = scopes.CreateScope();
            scope.ServiceProvider.GetRequiredService<TenantContext>().ResolveForJob(organizationId);
            await scope.ServiceProvider.GetRequiredService<ApplyRetentionHandler>().HandleAsync(cancellationToken);
        }
    }
}
