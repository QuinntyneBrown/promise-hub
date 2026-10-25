namespace PromiseHub.Api.Tests;

// L2-042 criterion 1: the API refuses to serve an unmigrated database and never migrates it.
public sealed class MigrationGuardTests
{
    [Fact]
    public void Api_refuses_to_start_when_migrations_are_pending()
    {
        using var factory = new PromiseHubApiFactory(migrateAndSeed: false);

        var error = Assert.ThrowsAny<Exception>(() => factory.CreateClient());

        Assert.Contains("Initial", error.ToString());
    }
}
