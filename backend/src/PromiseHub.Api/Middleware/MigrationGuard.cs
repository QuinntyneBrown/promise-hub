using PromiseHub.Infrastructure.Persistence;

namespace PromiseHub.Api.Middleware;

/// <summary>Stops the host before it serves a request when the database has pending migrations. It never applies them.</summary>
public sealed class MigrationGuard(IServiceScopeFactory scopes, ILogger<MigrationGuard> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopes.CreateAsyncScope();
        var pending = await scope.ServiceProvider.GetRequiredService<IMigrationStatus>().PendingAsync(cancellationToken);
        if (pending.Count == 0)
        {
            return;
        }
        foreach (var migration in pending)
        {
            logger.LogCritical("Pending migration {Migration}; run the CLI migrate command.", migration);
        }
        throw new InvalidOperationException($"The database has pending migrations: {string.Join(", ", pending)}.");
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
