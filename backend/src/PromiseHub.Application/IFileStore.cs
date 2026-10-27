namespace PromiseHub.Application;

/// <summary>PromiseHub file storage (ADR 0050): files saved and deleted by a key the caller generates, never by a user's file name.</summary>
public interface IFileStore
{
    Task SaveAsync(string key, Stream content, CancellationToken cancellationToken);

    Task DeleteAsync(string key, CancellationToken cancellationToken);

    Task<bool> ExistsAsync(string key, CancellationToken cancellationToken);

    /// <summary>A seekable, read-only stream of the stored file, or null when there is none (ADR 0051).</summary>
    Task<Stream?> OpenReadAsync(string key, CancellationToken cancellationToken);
}
