using Microsoft.EntityFrameworkCore;

namespace PromiseHub.Infrastructure.Persistence;

public interface IMigrationStatus
{
    Task<IReadOnlyList<string>> PendingAsync(CancellationToken cancellationToken = default);
}

public sealed class MigrationStatus(PromiseHubDbContext db) : IMigrationStatus
{
    public async Task<IReadOnlyList<string>> PendingAsync(CancellationToken cancellationToken = default) =>
        [.. await db.Database.GetPendingMigrationsAsync(cancellationToken)];
}
