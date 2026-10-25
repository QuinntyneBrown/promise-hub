namespace PromiseHub.Infrastructure.Persistence;

public interface IMigrationStatus
{
    Task<IReadOnlyList<string>> PendingAsync(CancellationToken cancellationToken = default);
}
