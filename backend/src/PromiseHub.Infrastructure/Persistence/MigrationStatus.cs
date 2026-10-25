using Microsoft.EntityFrameworkCore;

namespace PromiseHub.Infrastructure.Persistence;

public sealed class MigrationStatus(PromiseHubDbContext db) : IMigrationStatus
{
    public async Task<IReadOnlyList<string>> PendingAsync(CancellationToken cancellationToken = default) =>
        [.. await db.Database.GetPendingMigrationsAsync(cancellationToken)];
}
