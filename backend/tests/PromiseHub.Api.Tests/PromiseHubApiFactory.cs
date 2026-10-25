using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PromiseHub.Cli;

namespace PromiseHub.Api.Tests;

/// <summary>Hosts the API against a private in-memory SQLite database, migrated and seeded through the CLI.</summary>
public sealed class PromiseHubApiFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection _keepAlive;

    public PromiseHubApiFactory()
        : this(migrateAndSeed: true)
    {
    }

    internal PromiseHubApiFactory(bool migrateAndSeed)
    {
        ConnectionString = $"Data Source=file:promisehub-{Guid.NewGuid():N}?mode=memory&cache=shared";
        _keepAlive = new SqliteConnection(ConnectionString);
        _keepAlive.Open();
        if (migrateAndSeed)
        {
            CliApp.RunAsync(["migrate"], ConnectionString, output: TextWriter.Null).GetAwaiter().GetResult();
            CliApp.RunAsync(["seed"], ConnectionString, output: TextWriter.Null).GetAwaiter().GetResult();
        }
    }

    public string ConnectionString { get; }

    public HttpClient ClientFor(Guid membershipId)
    {
        var client = CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(TestAuthHandler.SchemeName, membershipId.ToString());
        return client;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:PromiseHub", ConnectionString);
        builder.ConfigureServices(services =>
        {
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
