using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Time.Testing;
using PromiseHub.Cli;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

/// <summary>
/// Hosts the API against a private in-memory SQLite database, migrated and seeded through the CLI,
/// with a fake clock. With <c>testAuth</c> the Authorization header names the session's membership;
/// without it the real cookie sign-in runs.
/// </summary>
public abstract class ApiFactoryBase : WebApplicationFactory<Program>
{
    public const string StaffPassword = "test-password-2026";
    public const string MfaSecret = "JBSWY3DPEHPK3PXP";

    private readonly SqliteConnection _keepAlive;
    private readonly bool _testAuth;

    protected ApiFactoryBase(bool migrateAndSeed, bool testAuth)
    {
        _testAuth = testAuth;
        ConnectionString = $"Data Source=file:promisehub-{Guid.NewGuid():N}?mode=memory&cache=shared";
        _keepAlive = new SqliteConnection(ConnectionString);
        _keepAlive.Open();
        if (migrateAndSeed)
        {
            var seed = new SeedOptions(StaffPassword, MfaSecret);
            CliApp.RunAsync(["migrate"], ConnectionString, output: TextWriter.Null).GetAwaiter().GetResult();
            CliApp.RunAsync(["seed"], ConnectionString, output: TextWriter.Null, seed: seed).GetAwaiter().GetResult();
        }
    }

    public string ConnectionString { get; }

    public FakeTimeProvider Clock { get; } = new(new DateTimeOffset(2026, 11, 5, 21, 12, 0, TimeSpan.Zero));

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:PromiseHub", ConnectionString);
        builder.ConfigureServices(services =>
        {
            services.AddSingleton<TimeProvider>(Clock);
            if (!_testAuth)
            {
                return;
            }
            services.AddAuthentication(TestAuthHandler.SchemeName)
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(TestAuthHandler.SchemeName, null);
            services.PostConfigure<AuthenticationOptions>(o =>
            {
                o.DefaultScheme = TestAuthHandler.SchemeName;
                o.DefaultAuthenticateScheme = TestAuthHandler.SchemeName;
                o.DefaultChallengeScheme = TestAuthHandler.SchemeName;
            });
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        _keepAlive.Dispose();
    }
}
