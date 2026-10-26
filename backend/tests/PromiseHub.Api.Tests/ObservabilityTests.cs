using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-041 observability: one structured line per request, outside exception handling.
public sealed class ObservabilityTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");

    private readonly PromiseHubApiFactory _factory = new();
    private readonly CapturingLoggerProvider _logs = new();
    private Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory<Program> _host = null!;

    [Fact]
    public async Task Every_request_logs_tenant_route_status_duration_and_correlation_id()
    {
        var response = await Client(Tom).GetAsync($"/households/{DatabaseSeeder.HouseholdId(DatabaseSeeder.Harbourview, "Rivera")}");

        var line = RequestLine();
        Assert.Equal(DatabaseSeeder.Harbourview.ToString(), line.Values["OrganizationId"]?.ToString());
        Assert.Equal("/households/{id:guid}", line.Values["Route"]);
        Assert.Equal(200, line.Values["Status"]);
        Assert.True(line.Values.ContainsKey("DurationMs"));
        Assert.Equal(response.Headers.GetValues("X-Correlation-Id").Single(), line.Values["CorrelationId"]);
    }

    [Fact]
    public async Task A_correlation_id_sent_by_the_caller_is_kept()
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/today");
        request.Headers.Add("X-Correlation-Id", "abc-123");

        var response = await Client(Grace).SendAsync(request);

        Assert.Equal("abc-123", response.Headers.GetValues("X-Correlation-Id").Single());
        Assert.Equal("abc-123", RequestLine().Values["CorrelationId"]);
        Assert.Equal(DatabaseSeeder.Northgate.ToString(), RequestLine().Values["OrganizationId"]?.ToString());
    }

    [Fact]
    public async Task The_log_never_carries_a_childs_name_from_the_query()
    {
        await Client(Tom).GetAsync("/search?q=Mateo");

        Assert.DoesNotContain(_logs.Lines, l => l.Message.Contains("Mateo", StringComparison.Ordinal));
    }

    [Fact]
    public async Task A_fault_answers_500_with_a_reference_and_is_logged_as_500()
    {
        var response = await Client(Tom).GetAsync("/test/fault");

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("server-error", body.GetProperty("code").GetString());
        Assert.Equal(response.Headers.GetValues("X-Correlation-Id").Single(), body.GetProperty("reference").GetString());
        Assert.Equal(500, RequestLine().Values["Status"]);
        Assert.DoesNotContain("secret-detail", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task A_handled_refusal_is_logged_with_its_own_status()
    {
        await Client(DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example")).GetAsync("/audit");

        Assert.Equal(403, RequestLine().Values["Status"]);
    }

    private CapturedLog RequestLine() => _logs.Lines.Last(l => l.Values.ContainsKey("CorrelationId") && l.Values.ContainsKey("Status"));

    private HttpClient Client(Guid membership)
    {
        var client = _host.CreateClient();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Test", membership.ToString());
        return client;
    }

    public Task InitializeAsync()
    {
        _host = _factory.WithWebHostBuilder(b =>
        {
            b.ConfigureLogging(l => l.AddProvider(_logs));
            b.ConfigureServices(s => s.AddSingleton<IStartupFilter, FaultRouteFilter>());
        });
        return Task.CompletedTask;
    }

    public async Task DisposeAsync()
    {
        await _host.DisposeAsync();
        await _factory.DisposeAsync();
    }

    /// <summary>Adds a route that throws, after the app's own pipeline, to prove faults are handled and logged.</summary>
    private sealed class FaultRouteFilter : IStartupFilter
    {
        public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next) => app =>
        {
            next(app);
            app.Map("/test/fault", b => b.Run(_ => throw new InvalidOperationException("secret-detail")));
        };
    }
}
