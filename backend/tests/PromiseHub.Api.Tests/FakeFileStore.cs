using System.Collections.Concurrent;
using PromiseHub.Application;

namespace PromiseHub.Api.Tests;

/// <summary>Keeps stored files in memory instead of on disk.</summary>
public sealed class FakeFileStore : IFileStore
{
    private readonly ConcurrentDictionary<string, byte[]> _files = new();

    public IReadOnlyDictionary<string, byte[]> Files => _files;

    public async Task SaveAsync(string key, Stream content, CancellationToken cancellationToken)
    {
        using var buffer = new MemoryStream();
        await content.CopyToAsync(buffer, cancellationToken);
        _files[key] = buffer.ToArray();
    }

    public Task DeleteAsync(string key, CancellationToken cancellationToken)
    {
        _files.TryRemove(key, out _);
        return Task.CompletedTask;
    }

    public Task<bool> ExistsAsync(string key, CancellationToken cancellationToken) => Task.FromResult(_files.ContainsKey(key));
}
