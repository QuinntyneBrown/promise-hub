using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Observability;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-041 criteria 2 and 3: alerts for the error rate and for an old job queue, per tenant.
public sealed class AlertTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");

    private readonly PromiseHubApiFactory _factory = new();
    private readonly FakeAlertSender _alerts = new();
    private WebApplicationFactory<Program> _host = null!;

    [Fact]
    public async Task A_healthy_service_raises_nothing()
    {
        for (var i = 0; i < 30; i++)
        {
            await Client().GetAsync("/today");
        }

        await Monitor.CheckAsync();

        Assert.Empty(_alerts.Raised);
    }

    [Fact]
    public async Task More_than_one_percent_errors_over_five_minutes_raises_one_alert()
    {
        for (var i = 0; i < 30; i++)
        {
            await Client().GetAsync("/today");
        }
        await Client().GetAsync("/test/fault");

        await Monitor.CheckAsync();
        await Monitor.CheckAsync();

        var alert = Assert.Single(_alerts.Raised);
        Assert.Equal("error-rate", alert.Kind);
    }

    [Fact]
    public async Task A_queue_older_than_ten_minutes_raises_an_alert_naming_its_tenant()
    {
        await Client().PostAsJsonAsync("/messages", new { subject = "Tonight", body = "Tutoring is on.", channel = "TextOnly", audience = new { programId = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring") } });
        _factory.Clock.Advance(TimeSpan.FromMinutes(9));
        await Monitor.CheckAsync();
        Assert.Empty(_alerts.Raised);

        _factory.Clock.Advance(TimeSpan.FromMinutes(2));
        await Monitor.CheckAsync();

        var alert = Assert.Single(_alerts.Raised);
        Assert.Equal("queue-age", alert.Kind);
        Assert.Equal(DatabaseSeeder.Harbourview, alert.OrganizationId);
    }

    private OpsAlertMonitor Monitor => _host.Services.GetRequiredService<OpsAlertMonitor>();

    private HttpClient Client()
    {
        var client = _host.CreateClient();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Test", Tom.ToString());
        return client;
    }

    public Task InitializeAsync()
    {
        _host = _factory.WithWebHostBuilder(b => b.ConfigureServices(s =>
        {
            s.AddSingleton<IStartupFilter, FaultRouteFilter>();
            s.AddSingleton<IAlertSender>(_alerts);
        }));
        return Task.CompletedTask;
    }

    public async Task DisposeAsync()
    {
        await _host.DisposeAsync();
        await _factory.DisposeAsync();
    }
}
