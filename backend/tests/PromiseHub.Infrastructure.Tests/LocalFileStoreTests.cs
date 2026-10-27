using PromiseHub.Infrastructure.Storage;

namespace PromiseHub.Infrastructure.Tests;

// Traces to: L2-067 criterion 7, L2-031 (lesson videos kept by a generated key inside the storage root, ADR 0050).
public sealed class LocalFileStoreTests : IDisposable
{
    private readonly string _root = Path.Combine(Path.GetTempPath(), $"promisehub-files-{Guid.NewGuid():N}");

    [Fact]
    public async Task A_file_is_saved_under_its_key_found_and_deleted()
    {
        var store = new LocalFileStore(_root);
        var key = $"lessons/{Guid.NewGuid()}/{Guid.NewGuid()}/{Guid.NewGuid():N}.mp4";

        await store.SaveAsync(key, new MemoryStream([1, 2, 3]), CancellationToken.None);

        Assert.True(await store.ExistsAsync(key, CancellationToken.None));
        Assert.Equal([1, 2, 3], await File.ReadAllBytesAsync(Path.Combine(_root, key)));
        await store.DeleteAsync(key, CancellationToken.None);
        Assert.False(await store.ExistsAsync(key, CancellationToken.None));
    }

    [Fact]
    public async Task A_key_that_leaves_the_root_is_refused()
    {
        var store = new LocalFileStore(_root);

        await Assert.ThrowsAsync<ArgumentException>(() => store.SaveAsync("../outside.mp4", new MemoryStream([1]), CancellationToken.None));
        Assert.False(File.Exists(Path.Combine(Path.GetDirectoryName(_root)!, "outside.mp4")));
    }

    public void Dispose()
    {
        if (Directory.Exists(_root))
        {
            Directory.Delete(_root, recursive: true);
        }
    }
}
